/**
 * Maps a life-stage tile selection to inferred demographic fields.
 * All inferred values should be tagged with `source: "inferred"` when
 * persisted so the CRM can distinguish them from user-confirmed data.
 */

export type InferredFields = {
  birth_year: number | null;
  has_children: boolean | null;
  children_ages: number[] | null;
  is_revert: boolean | null;
};

const CURRENT_YEAR = new Date().getFullYear();

const INFERENCE_MAP: Record<string, InferredFields> = {
  student: {
    birth_year: CURRENT_YEAR - 21,
    has_children: false,
    children_ages: null,
    is_revert: false,
  },
  single_working: {
    birth_year: CURRENT_YEAR - 27,
    has_children: false,
    children_ages: null,
    is_revert: false,
  },
  newly_married: {
    birth_year: CURRENT_YEAR - 29,
    has_children: false,
    children_ages: null,
    is_revert: false,
  },
  parent_young_kids: {
    birth_year: CURRENT_YEAR - 34,
    has_children: true,
    children_ages: [4],
    is_revert: false,
  },
  parent_teens: {
    birth_year: CURRENT_YEAR - 44,
    has_children: true,
    children_ages: [14],
    is_revert: false,
  },
  empty_nester: {
    birth_year: CURRENT_YEAR - 54,
    has_children: true,
    children_ages: [25],
    is_revert: false,
  },
  retired: {
    birth_year: CURRENT_YEAR - 64,
    has_children: true,
    children_ages: [35],
    is_revert: false,
  },
  new_to_islam: {
    birth_year: null,
    has_children: null,
    children_ages: null,
    is_revert: true,
  },
};

export function inferFromLifeStage(stage: string): InferredFields {
  return (
    INFERENCE_MAP[stage] ?? {
      birth_year: null,
      has_children: null,
      children_ages: null,
      is_revert: null,
    }
  );
}

/**
 * Builds the `data_sources` JSONB object that records which fields were
 * inferred rather than explicitly provided by the user.
 */
export function buildDataSources(inferred: InferredFields): Record<string, string> {
  const sources: Record<string, string> = {};
  if (inferred.birth_year != null) sources.birth_year = 'inferred';
  if (inferred.has_children != null) sources.has_children = 'inferred';
  if (inferred.children_ages != null) sources.children_ages = 'inferred';
  if (inferred.is_revert != null) sources.is_revert = 'inferred';
  return sources;
}
