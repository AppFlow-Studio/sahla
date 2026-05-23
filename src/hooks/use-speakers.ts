import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@/src/hooks/use-supabase';
import { useConfigStore } from '@/src/stores/config-store';

export type SpeakerRow = {
  speaker_id: string;
  mosque_id: string;
  speaker_name: string | null;
  speaker_img: string | null;
  speaker_creds: string[] | null;
  created_at: string;
  updated_at: string | null;
};

export function useSpeakers() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);

  const query = useQuery({
    queryKey: ['speakers', mosqueUuid],
    queryFn: async (): Promise<SpeakerRow[]> => {
      const { data, error } = await supabase
        .from('speaker_data')
        .select('*')
        .eq('mosque_id', mosqueUuid!)
        .order('created_at', { ascending: true });

      if (error) throw new Error(error.message);
      return (data as SpeakerRow[]) ?? [];
    },
    enabled: !!mosqueUuid,
  });

  return {
    speakers: query.data ?? [],
    isLoading: query.isPending,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
}

export type CreateSpeakerInput = {
  speaker_name: string;
  speaker_img?: string | null;
  speaker_creds?: string[];
};

export function useCreateSpeaker() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSpeakerInput) => {
      if (!mosqueUuid) throw new Error('No mosque configured');
      const { data, error } = await supabase
        .from('speaker_data')
        .insert({ mosque_id: mosqueUuid, ...input })
        .select('speaker_id')
        .single();
      if (error) throw new Error(error.message);
      return data as { speaker_id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speakers', mosqueUuid] });
    },
  });
}

export type UpdateSpeakerInput = {
  speaker_id: string;
  speaker_name?: string;
  speaker_img?: string | null;
  speaker_creds?: string[];
};

export function useUpdateSpeaker() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ speaker_id, ...updates }: UpdateSpeakerInput) => {
      const { error } = await supabase
        .from('speaker_data')
        .update(updates)
        .eq('speaker_id', speaker_id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speakers', mosqueUuid] });
    },
  });
}

export function useDeleteSpeaker() {
  const supabase = useSupabase();
  const mosqueUuid = useConfigStore((s) => s.mosqueUuid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (speakerId: string) => {
      // Nullify any jummah slots referencing this speaker first
      await supabase
        .from('jummah')
        .update({ speaker: null })
        .eq('speaker', speakerId);

      const { error } = await supabase
        .from('speaker_data')
        .delete()
        .eq('speaker_id', speakerId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['speakers', mosqueUuid] });
      queryClient.invalidateQueries({ queryKey: ['jummah', mosqueUuid] });
    },
  });
}
