/**
 * The catalogue of notifications the system sends on its own, their default
 * wording, and the renderer that fills one in.
 *
 * Dependency-free on purpose: the Deno senders import it by relative path
 * (`../_shared/automated-notifications.ts`) and the Next CRM imports it as
 * `@/supabase/functions/_shared/automated-notifications`. One list, so the
 * editor in the CRM can never drift from what actually goes out.
 *
 * NOTE: this file is duplicated in the other repo (sahla ↔ sahla-web). The
 * senders here read it; the CRM's editor imports it to build the form. Keep the
 * two copies identical — a key that exists on one side only is a template an
 * admin can edit that nothing sends, or a notification nobody can edit.
 *
 * Adding a notification kind = adding an entry here. No migration, no backfill:
 * a masjid with no override row gets the default below.
 */

/** Stable identifier stored in `automated_notification_templates.notification_key`. */
export type NotificationKey =
  | "prayer.athan"
  | "prayer.reminder_30"
  | "prayer.iqamah"
  | "content.program_reminder"
  | "content.event_reminder"
  | "engagement.quran_goal";

export type TemplateVariable = {
  /** Written as {{name}} in the template. */
  name: string;
  /** Shown next to the field in the CRM so an admin knows what it fills in. */
  description: string;
  /** Stand-in used for the CRM's live preview. */
  example: string;
};

export type NotificationDefinition = {
  key: NotificationKey;
  /** Grouping in the CRM UI. */
  group: "Prayer times" | "Programs & events" | "Engagement";
  label: string;
  /** When this fires, in the admin's terms. */
  description: string;
  variables: TemplateVariable[];
  defaultTitle: string;
  defaultBody: string;
};

const PRAYER_VARS: TemplateVariable[] = [
  { name: "prayer", description: "The prayer's name", example: "Maghrib" },
  { name: "masjid", description: "Your masjid's name", example: "Masjid Al Firdaus" },
  { name: "time", description: "The time it happens, in your masjid's timezone", example: "6:42 PM" },
];

const CONTENT_VARS: TemplateVariable[] = [
  { name: "name", description: "The program or event's name", example: "Tafsir Halaqa" },
  { name: "masjid", description: "Your masjid's name", example: "Masjid Al Firdaus" },
  { name: "time", description: "When it starts, in your masjid's timezone", example: "8:00 PM" },
  {
    name: "when",
    description: 'How far off it is — "in 30 minutes", "tomorrow", "now"',
    example: "in 30 minutes",
  },
];

/**
 * Defaults are the exact strings the senders used before this was editable, so
 * turning the feature on changes nothing for a masjid that never opens the
 * editor. `{{masjid}}` used to be appended as " at <name>" only when a name
 * existed; that conditional is gone — an empty variable renders as nothing and
 * the renderer tidies up the leftover whitespace.
 */
export const NOTIFICATION_CATALOGUE: NotificationDefinition[] = [
  {
    key: "prayer.athan",
    group: "Prayer times",
    label: "Athan",
    description: "Sent at the athan time for each prayer members have turned on.",
    variables: PRAYER_VARS,
    defaultTitle: "{{prayer}}",
    defaultBody: "It's time for {{prayer}} at {{masjid}}.",
  },
  {
    key: "prayer.reminder_30",
    group: "Prayer times",
    label: "30-minute reminder",
    description: "Sent half an hour before the athan.",
    variables: PRAYER_VARS,
    defaultTitle: "{{prayer}} in 30 minutes",
    defaultBody: "{{prayer}} at {{masjid}} is in 30 minutes.",
  },
  {
    key: "prayer.iqamah",
    group: "Prayer times",
    label: "Iqamah",
    description: "Sent at the iqamah time you've set for each prayer.",
    variables: PRAYER_VARS,
    defaultTitle: "{{prayer}} Iqamah",
    defaultBody: "Iqamah for {{prayer}} at {{masjid}} is now.",
  },
  {
    key: "content.program_reminder",
    group: "Programs & events",
    label: "Program reminder",
    description:
      "Sent before a program a member has turned reminders on for, at whichever timings they picked.",
    variables: CONTENT_VARS,
    defaultTitle: "{{name}}",
    defaultBody: "{{name}} at {{masjid}} starts {{when}} — {{time}}.",
  },
  {
    key: "content.event_reminder",
    group: "Programs & events",
    label: "Event reminder",
    description:
      "Sent before an event a member has turned reminders on for, at whichever timings they picked.",
    variables: CONTENT_VARS,
    defaultTitle: "{{name}}",
    defaultBody: "{{name}} at {{masjid}} starts {{when}} — {{time}}.",
  },
  {
    key: "engagement.quran_goal",
    group: "Engagement",
    label: "Quran goal nudge",
    description:
      "Sent once a day to members who set a Quran reading goal and haven't finished today's pages.",
    variables: [
      { name: "masjid", description: "Your masjid's name", example: "Masjid Al Firdaus" },
      { name: "pages", description: "Pages they still have left", example: "3" },
      { name: "pageWord", description: '"page" or "pages", matched to the number', example: "pages" },
    ],
    defaultTitle: "{{pages}} more {{pageWord}} to hit your Quran goal",
    defaultBody: "Almost there — open the Quran at {{masjid}} to finish today's reading.",
  },
];

const BY_KEY = new Map<string, NotificationDefinition>(
  NOTIFICATION_CATALOGUE.map((d) => [d.key, d]),
);

export function definitionFor(key: string): NotificationDefinition | undefined {
  return BY_KEY.get(key);
}

/** One masjid's override, as stored. Any null field falls back to the default. */
export type TemplateOverride = {
  notification_key: string;
  title: string | null;
  body: string | null;
  enabled: boolean;
};

/**
 * Substitute {{variables}} and tidy the result.
 *
 * A missing or empty variable collapses rather than leaving a hole: the
 * default bodies read "... at {{masjid}}." and a masjid without a name would
 * otherwise send "It's time for Fajr at ." Unknown variables are left as-is so
 * a typo in the CRM is visible in the preview instead of vanishing silently.
 */
export function render(template: string, values: Record<string, string | null | undefined>): string {
  const filled = template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => {
    if (!(name in values)) return match;
    return values[name]?.trim() ?? "";
  });

  return filled
    // " at ." / " at ," left by an empty variable at the end of a clause.
    .replace(/\s+(?:at|for|in)\s*([.,!?;:])/g, "$1")
    // Collapse the gap an empty variable leaves mid-sentence.
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

/**
 * The message to actually send for one notification kind, given a masjid's
 * override (or none). Returns null when the masjid has switched this kind off.
 */
export function resolveMessage(
  key: NotificationKey,
  values: Record<string, string | null | undefined>,
  override?: TemplateOverride | null,
): { title: string; body: string } | null {
  const def = BY_KEY.get(key);
  if (!def) return null;
  if (override && override.enabled === false) return null;

  const title = override?.title?.trim() || def.defaultTitle;
  const body = override?.body?.trim() || def.defaultBody;
  return { title: render(title, values), body: render(body, values) };
}
