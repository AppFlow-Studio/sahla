import type { ImageSourcePropType } from 'react-native';

import type { AudienceFilter } from '@/src/hooks/use-program-categories';

/**
 * The original hardcoded Discover "Programs" cards. Used as a fallback on the
 * Discover home when a mosque hasn't configured any custom categories yet, and
 * to seed the first rows from the admin screen. The bundled artwork is keyed by
 * title so a DB row with no image_url can still render the matching default.
 */
export type DefaultCategory = {
  title: string;
  audience_filter: AudienceFilter;
  image: ImageSourcePropType;
};

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    title: 'Kids',
    audience_filter: 'Kids',
    image: require('@/assets/images/kids_discover_design.png'),
  },
  {
    title: 'Youth',
    audience_filter: 'Youth',
    image: require('@/assets/images/youth_discover_design.png'),
  },
  {
    title: 'Adults',
    audience_filter: 'Adults',
    image: require('@/assets/images/adult_discover_design.png'),
  },
];

/** Bundled artwork for a default category title, or undefined if not a default. */
export function defaultImageForTitle(
  title: string | null | undefined,
): ImageSourcePropType | undefined {
  if (!title) return undefined;
  const match = DEFAULT_CATEGORIES.find(
    (c) => c.title.toLowerCase() === title.toLowerCase(),
  );
  return match?.image;
}
