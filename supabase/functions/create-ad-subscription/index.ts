import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import Stripe from "https://esm.sh/stripe@17.5.0?target=deno";
import { resolveConnectedCustomer } from "../_shared/stripe-customer.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Creates a Stripe Subscription (monthly ad fee) with a one-time onboarding
 * invoice item on the mosque's connected account, and persists the matching
 * `business_ads_submissions` + `ad_subscriptions` rows up front so a payment
 * can never succeed without a database record. The Stripe-verified webhook
 * (`stripe-webhook`) promotes these rows to paid/active once the first invoice
 * is paid.
 *
 * Body: {
 *   user_id: string
 *   mosque_id: string        — mosque UUID
 *   customer_email?: string
 *   full_name?: string
 *   phone?: string
 *   business_name?: string
 *   business_address?: string
 * }
 *
 * Returns: {
 *   clientSecret, ephemeralKey, customerId, subscriptionId, submissionId,
 *   publishableKey, stripeAccountId
 * }
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2024-12-18.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const {
      user_id,
      mosque_id,
      customer_email,
      full_name,
      phone,
      business_name,
      business_address,
      business_flyer_img,
    } = await req.json();

    if (!user_id || !mosque_id) {
      return new Response(
        JSON.stringify({ error: "user_id and mosque_id are required" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Look up mosque config
    const { data: mosque, error: mosqueError } = await supabase
      .from("mosques")
      .select("stripe_account_id, ads_enabled, ad_monthly_price_cents, ad_onboarding_fee_cents")
      .eq("id", mosque_id)
      .single();

    if (mosqueError || !mosque?.stripe_account_id) {
      return new Response(
        JSON.stringify({ error: "Mosque not found or Stripe not configured" }),
        { status: 400, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    if (!mosque.ads_enabled) {
      return new Response(
        JSON.stringify({ error: "Business ads are not enabled for this mosque" }),
        { status: 403, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    const connectedAccountId = mosque.stripe_account_id;
    const monthlyPriceCents = mosque.ad_monthly_price_cents ?? 5000;
    const onboardingFeeCents = mosque.ad_onboarding_fee_cents ?? 10000;
    const stripeAccountOpts = { stripeAccount: connectedAccountId };

    // ── Persist the submission BEFORE touching Stripe ──
    // Created as `pending_payment`; the webhook flips it to `submitted` once
    // the first invoice is paid. Creating it first guarantees that no Stripe
    // charge can exist without a corresponding DB record.
    const { data: submissionRow, error: submissionErr } = await supabase
      .from("business_ads_submissions")
      .insert({
        user_id,
        mosque_id,
        personal_full_name: full_name ?? null,
        personal_email: customer_email ?? null,
        personal_phone: phone ?? null,
        business_name: business_name ?? null,
        business_address: business_address ?? null,
        business_flyer_img: business_flyer_img ?? null,
        status: "pending_payment",
      })
      .select("submission_id")
      .single();

    if (submissionErr || !submissionRow) {
      console.error("[create-ad-subscription] submission insert failed:", submissionErr);
      return new Response(
        JSON.stringify({ error: "Failed to record submission" }),
        { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }
    const submissionId = submissionRow.submission_id;

    // ── Find or create Stripe Customer on connected account ──
    const customer = await resolveConnectedCustomer({
      stripe,
      supabase,
      connectedAccountId,
      userId: user_id,
      email: customer_email,
    });

    // ── Find or create Product + Price on connected account ──
    let product: Stripe.Product | undefined;
    const products = await stripe.products.search(
      { query: `metadata["type"]:"business_ad"` },
      stripeAccountOpts,
    );
    product = products.data[0];

    if (!product) {
      product = await stripe.products.create(
        {
          name: "Business Ad — Monthly",
          metadata: { type: "business_ad" },
        },
        stripeAccountOpts,
      );
    }

    // Find existing price matching the amount, or create one
    const prices = await stripe.prices.list(
      {
        product: product.id,
        active: true,
        type: "recurring",
        limit: 10,
      },
      stripeAccountOpts,
    );
    let price = prices.data.find(
      (p) =>
        p.unit_amount === monthlyPriceCents &&
        p.currency === "usd" &&
        p.recurring?.interval === "month",
    );

    if (!price) {
      price = await stripe.prices.create(
        {
          product: product.id,
          unit_amount: monthlyPriceCents,
          currency: "usd",
          recurring: { interval: "month" },
        },
        stripeAccountOpts,
      );
    }

    // ── Add one-time onboarding fee as an invoice item ──
    await stripe.invoiceItems.create(
      {
        customer: customer.id,
        amount: onboardingFeeCents,
        currency: "usd",
        description: "Business Ad — Onboarding Fee",
      },
      stripeAccountOpts,
    );

    // ── Create Subscription (incomplete — needs payment confirmation) ──
    const subscription = await stripe.subscriptions.create(
      {
        customer: customer.id,
        items: [{ price: price.id }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
        },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          type: "business_ad",
          mosque_id,
          user_id,
          submission_id: submissionId,
        },
      },
      stripeAccountOpts,
    );

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    // Tag the PaymentIntent so the payment-history screen labels this charge as
    // a Business Ad (it reads pi.metadata.label; without this it defaults to
    // "Donation").
    if (paymentIntent?.id) {
      await stripe.paymentIntents.update(
        paymentIntent.id,
        { metadata: { type: "business_ad", label: "Business Ad", mosque_id, user_id } },
        stripeAccountOpts,
      );
    }

    // ── Persist the ad subscription (pending until the webhook confirms payment) ──
    // amounts are stored in dollars to match the donations table convention.
    const { error: adSubErr } = await supabase.from("ad_subscriptions").insert({
      mosque_id,
      submission_id: submissionId,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      stripe_payment_intent_id: paymentIntent?.id ?? null,
      pricing_model: "monthly_plus_onboarding",
      onboarding_amount: onboardingFeeCents / 100,
      recurring_amount: monthlyPriceCents / 100,
      onboarding_paid: false,
      status: "pending",
    });
    if (adSubErr) {
      // Non-fatal: the subscription_id is in Stripe metadata, so the webhook
      // can still reconcile this on invoice.paid. Log and continue.
      console.error("[create-ad-subscription] ad_subscriptions insert failed:", adSubErr);
    }

    // Ephemeral key for mobile SDK
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: "2024-12-18.acacia", ...stripeAccountOpts },
    );

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customerId: customer.id,
        subscriptionId: subscription.id,
        submissionId,
        publishableKey: Deno.env.get("STRIPE_PUBLISHABLE_KEY")!,
        stripeAccountId: connectedAccountId,
      }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[create-ad-subscription] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error", detail: String(err) }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
