import { useUser } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';

import type { OnboardingDraft } from '@/src/contexts/onboarding-draft-context';
import { useSupabase } from '@/src/hooks/use-supabase';
import { syncOnboardingToClerk } from '@/src/hooks/use-onboarding-sync';
import {
  buildDataSources,
  inferFromLifeStage,
} from '@/src/lib/life-stage-inference';
import { useConfigStore } from '@/src/stores/config-store';
import { useOnboardingStore } from '@/src/stores/onboarding-store';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

/**
 * Batch-writes all onboarding data collected across screens 1-4 in a single
 * mutation. Called on Screen 4 submit.
 *
 * 1. Upserts `user_preferences` with life_stage, knowledge_level, inferred
 *    demographics, preferred_language, and data_sources JSONB.
 * 2. Replaces `user_islamic_interests` rows for this user + mosque.
 * 3. Calls the sync-onboarding edge function to write Clerk metadata.
 * 4. Marks onboarding as complete in the local MMKV store.
 */
export function useOnboardingSubmit() {
  const { user } = useUser();
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const { clerkOrgId } = useMasjidConfig();
  const markComplete = useOnboardingStore((s) => s.markComplete);
  const setFirstName = useOnboardingStore((s) => s.setFirstName);

  return useMutation({
    mutationFn: async (draft: OnboardingDraft & { firstName: string; lastName: string }) => {
      const userId = user?.id;
      if (!userId || !mosqueUuid) {
        throw new Error('Cannot save — user or mosque not ready.');
      }

      // --- 1. Upsert user_preferences ---
      const primaryStage = draft.lifeStages[0] ?? null;
      const inferred = primaryStage
        ? inferFromLifeStage(primaryStage)
        : { birth_year: null, has_children: null, children_ages: null, is_revert: null };

      // If any selected stage is new_to_islam, mark as revert
      if (draft.lifeStages.includes('new_to_islam')) {
        inferred.is_revert = true;
      }
      // If any selected stage implies children, mark accordingly
      if (draft.lifeStages.some((s) => s === 'parent_young_kids' || s === 'parent_teens')) {
        inferred.has_children = true;
      }

      const dataSources = primaryStage ? buildDataSources(inferred) : {};

      const { error: prefError } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: userId,
            mosque_id: mosqueUuid,
            life_stage: draft.lifeStages.join(','),
            islamic_knowledge_level: draft.knowledgeLevel,
            preferred_language: draft.preferredLanguage,
            birth_year: inferred.birth_year,
            has_children: inferred.has_children,
            children_ages: inferred.children_ages,
            is_revert: inferred.is_revert,
            data_sources: dataSources,
          } as any,
          { onConflict: 'user_id,mosque_id' },
        );

      if (prefError) throw new Error(`Preferences: ${prefError.message}`);

      // --- 2. Replace user_islamic_interests ---
      if (draft.selectedInterestKeys.length > 0) {
        // Look up category IDs from keys
        const { data: categories, error: catError } = await supabase
          .from('islamic_interest_categories')
          .select('id, category_key')
          .in('category_key', draft.selectedInterestKeys);

        if (catError) throw new Error(`Categories: ${catError.message}`);

        // Delete existing rows for this user + mosque
        const { error: delError } = await supabase
          .from('user_islamic_interests')
          .delete()
          .eq('user_id', userId)
          .eq('mosque_id', mosqueUuid);

        if (delError) throw new Error(`Delete interests: ${delError.message}`);

        // Insert new rows
        const rows = (categories ?? []).map((cat) => ({
          user_id: userId,
          mosque_id: mosqueUuid,
          interest_id: cat.id,
          interest_level: 1,
        }));

        if (rows.length > 0) {
          const { error: insError } = await supabase
            .from('user_islamic_interests')
            .insert(rows);

          if (insError) throw new Error(`Insert interests: ${insError.message}`);
        }
      }

      // --- 3. Sync to Clerk ---
      setFirstName(draft.firstName);
      await syncOnboardingToClerk(
        { id: userId, publicMetadata: user?.publicMetadata ?? {} },
        clerkOrgId,
        draft.firstName,
        supabase,
      );

      // --- 4. Mark complete ---
      markComplete();
    },
  });
}
