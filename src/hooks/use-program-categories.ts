import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type AudienceFilter = 'All' | 'Kids' | 'Youth' | 'Adults';

export type ProgramCategoryRow = {
  id: string;
  mosque_id: string;
  title: string;
  image_url: string | null;
  bg_color: string | null;
  audience_filter: AudienceFilter;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
};

const keyFor = (mosqueUuid: string | null) => ['program-categories', mosqueUuid];

export function useProgramCategories() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: keyFor(mosqueUuid),
    queryFn: async (): Promise<ProgramCategoryRow[]> => {
      const { data, error } = await supabase
        .from('program_categories')
        .select('*')
        .eq('mosque_id', mosqueUuid!)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as ProgramCategoryRow[]) ?? [];
    },
    enabled: !!mosqueUuid,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isPending,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export type CreateCategoryInput = {
  title: string;
  image_url?: string | null;
  bg_color?: string | null;
  audience_filter?: AudienceFilter;
  sort_order?: number;
};

export function useCreateProgramCategory() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCategoryInput) => {
      if (!mosqueUuid) throw new Error('No mosque configured');
      const { data, error } = await supabase
        .from('program_categories')
        .insert({ mosque_id: mosqueUuid, ...input })
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      return data as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keyFor(mosqueUuid) });
    },
  });
}

export type UpdateCategoryInput = {
  id: string;
  title?: string;
  image_url?: string | null;
  bg_color?: string | null;
  audience_filter?: AudienceFilter;
  sort_order?: number;
};

export function useUpdateProgramCategory() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: UpdateCategoryInput) => {
      const { error } = await supabase
        .from('program_categories')
        .update(updates)
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keyFor(mosqueUuid) });
    },
  });
}

export function useDeleteProgramCategory() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('program_categories')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keyFor(mosqueUuid) });
    },
  });
}

/**
 * Persist a new ordering. Takes the full list of ids in their desired order and
 * writes each row's sort_order to match its index. Small lists (a handful of
 * cards) so individual updates are fine.
 */
export function useReorderProgramCategories() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase
            .from('program_categories')
            .update({ sort_order: index })
            .eq('id', id)
            .then(({ error }) => {
              if (error) throw new Error(error.message);
            }),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keyFor(mosqueUuid) });
    },
  });
}
