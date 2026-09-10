import type { MasjidConfig } from '@/src/config/types';

/**
 * Values substituted into the legal documents at render time.
 *
 * The masters in `Sahla Masjid Terms of Use.docx` / `…Privacy Policy.docx` ship
 * as templates whose own front matter states that "publication with any bracket
 * unresolved is a compliance defect". This file is where they get resolved.
 *
 * Two kinds of value live here:
 *
 *  - **Per-masjid**, derived from the tenant config at runtime, so each build
 *    is correct without anyone hand-editing prose per deployment.
 *  - **Fixed**, the same for every masjid.
 *
 * This build is a showcase for prospective masjids, not one masjid's own app,
 * so clauses that name a specific legal entity or postal address were removed
 * from `content.ts` rather than filled with guesses. A masjid publishing their
 * own app must restore them, and must register a DMCA agent — until then the
 * Terms' copyright section has no legal effect.
 */

/**
 * Fixed values, lifted verbatim from the masters where the master supplied one
 * inside its brackets. Confirm each against the incorporation paperwork before
 * publishing — the brackets in the source signal "verify", not "final".
 */
export const LEGAL_CONSTANTS = {
  SAHLA_ENTITY: 'Sahla, Inc.',
  SAHLA_STATE: 'Delaware',
  LEGAL_EMAIL: 'legal@sahla.co',
  PRIVACY_EMAIL: 'privacy@sahla.co',
  SUPPORT_EMAIL: 'support@sahla.co',
  DMCA_EMAIL: 'dmca@sahla.co',
  ARCHIVE_URL: 'sahla.co/legal/archive',

  /**
   * Printed in the document header. Standing in as the publication date of this
   * showcase build; a masjid shipping for real needs a date agreed with counsel
   * that does not precede incorporation.
   */
  EFFECTIVE_DATE: 'August 2026',
  VERSION: '1.0',
} as const;

/**
 * Per-masjid values.
 *
 * Only `MASJID_NAME` is per-tenant, and it comes from the config so it is right
 * in every build. The masjid's legal entity name and postal address are not
 * carried here: this build is a showcase for prospective masjids rather than
 * one masjid's own app, so there is no single entity to name. A masjid shipping
 * their own app needs those clauses restored — see the note at the top of
 * `content.ts`.
 *
 * Note the tenant row is not used for contact details on purpose. `mosques` for
 * the demo tenant holds a street address in NJ against a `state` of NY, and a
 * personal Gmail in `email`; neither belongs in a published legal document.
 */
export function legalFieldsFor(config: MasjidConfig) {
  const slug = config.id;
  return {
    ...LEGAL_CONSTANTS,
    MASJID_NAME: config.displayName,
    TERMS_URL: `sahla.co/${slug}/terms`,
    PRIVACY_URL: `sahla.co/${slug}/privacy`,
    DELETE_ACCOUNT_URL: `sahla.co/${slug}/delete-account`,
    PRIVACY_REQUEST_URL: `sahla.co/${slug}/privacy-request`,
  } satisfies Record<string, string>;
}

export type LegalFields = ReturnType<typeof legalFieldsFor>;

/**
 * Substitute `{{TOKEN}}` placeholders.
 *
 * An unknown token is left visible rather than blanked, so a missing field
 * shows up in review instead of silently deleting a clause.
 */
export function resolveLegalText(text: string, fields: LegalFields): string {
  return text.replace(/\{\{([A-Z_]+)\}\}/g, (whole, key: string) => {
    const value = (fields as Record<string, string | undefined>)[key];
    if (value === undefined) {
      if (__DEV__) console.warn(`[legal] no value for ${whole}`);
      return whole;
    }
    return value;
  });
}
