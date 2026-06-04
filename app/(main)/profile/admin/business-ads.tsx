import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import {
  useAdSubmissions,
  useAdDecision,
  type AdDecision,
  type AdSubmission,
} from '@/src/hooks/use-ad-submissions';

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  pending_payment: { label: 'Awaiting payment', bg: 'rgba(0,0,0,0.06)', fg: 'rgba(0,0,0,0.5)' },
  submitted: { label: 'Needs review', bg: 'rgba(180,146,42,0.15)', fg: '#8a6d1f' },
  approved: { label: 'Live', bg: 'rgba(22,163,74,0.12)', fg: '#15803d' },
  past_due: { label: 'Past due', bg: 'rgba(220,38,38,0.12)', fg: '#b91c1c' },
  canceled: { label: 'Canceled', bg: 'rgba(0,0,0,0.06)', fg: 'rgba(0,0,0,0.5)' },
  declined: { label: 'Declined', bg: 'rgba(220,38,38,0.12)', fg: '#b91c1c' },
};

export default function AdminBusinessAds() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useMasjidConfig();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const mutedRgb = `rgba(${colors.foreground.replace(/ /g, ',')}, 0.5)`;

  const { data: submissions, isLoading } = useAdSubmissions();
  const decide = useAdDecision();

  const runDecision = (s: AdSubmission, action: AdDecision) =>
    decide.mutate(
      { submissionId: s.submission_id, action },
      { onError: (e: any) => Alert.alert('Error', e?.message ?? 'Could not complete.') },
    );

  const confirmApprove = (s: AdSubmission) =>
    Alert.alert('Approve this ad?', `${s.business_name ?? 'This business'} will go live in the app.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: () => runDecision(s, 'approve') },
    ]);

  const confirmDecline = (s: AdSubmission) =>
    Alert.alert(
      'Decline this ad?',
      `${s.business_name ?? 'This application'} will be rejected and its subscription canceled (billing stops).`,
      [
        { text: 'Back', style: 'cancel' },
        { text: 'Decline', style: 'destructive', onPress: () => runDecision(s, 'decline') },
      ],
    );

  const confirmCancel = (s: AdSubmission) =>
    Alert.alert(
      'Cancel this ad?',
      `${s.business_name ?? 'This ad'} will be taken down and its subscription canceled (billing stops).`,
      [
        { text: 'Back', style: 'cancel' },
        { text: 'Take down', style: 'destructive', onPress: () => runDecision(s, 'cancel') },
      ],
    );

  // Surface review-needed first, then the rest.
  const ordered = [...(submissions ?? [])].sort((a, b) => {
    const rank = (s: string | null) => (s === 'submitted' ? 0 : s === 'approved' ? 1 : 2);
    return rank(a.status) - rank(b.status);
  });

  return (
    <View className="flex-1 bg-card" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center px-5" style={{ height: 52 }}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={fgRgb} />
        </Pressable>
        <Text style={{ color: fgRgb, fontSize: 16, fontWeight: '600', marginLeft: 12 }}>
          Business Ads
        </Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={fgRgb} />
        </View>
      ) : ordered.length === 0 ? (
        <View className="flex-1 items-center justify-center px-10">
          <MaterialCommunityIcons name="storefront-outline" size={40} color={mutedRgb} />
          <Text style={{ color: mutedRgb, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
            No ad applications yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 40, gap: 14 }}
        >
          {ordered.map((s) => {
            const meta = STATUS_META[s.status ?? ''] ?? null;
            return (
              <View
                key={s.submission_id}
                className="overflow-hidden rounded-2xl border border-foreground/10 bg-background"
              >
                {s.business_flyer_img ? (
                  <Image
                    source={{ uri: s.business_flyer_img }}
                    contentFit="cover"
                    style={{ width: '100%', height: 150 }}
                  />
                ) : (
                  <View className="h-[120px] items-center justify-center bg-foreground/5">
                    <MaterialCommunityIcons name="image-outline" size={28} color={mutedRgb} />
                  </View>
                )}

                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 text-[16px] font-semibold text-foreground" numberOfLines={1}>
                      {s.business_name ?? 'Untitled business'}
                    </Text>
                    {meta ? (
                      <View
                        style={{ backgroundColor: meta.bg }}
                        className="ml-2 rounded-full px-2.5 py-1"
                      >
                        <Text style={{ color: meta.fg, fontSize: 10, fontWeight: '700' }}>
                          {meta.label.toUpperCase()}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {s.business_address ? (
                    <Text className="mt-1 text-[13px] text-foreground/50" numberOfLines={1}>
                      {s.business_address}
                    </Text>
                  ) : null}
                  <View className="mt-2 gap-0.5">
                    {s.personal_full_name ? (
                      <Text className="text-[12px] text-foreground/60">{s.personal_full_name}</Text>
                    ) : null}
                    {s.personal_email ? (
                      <Text className="text-[12px] text-foreground/45">{s.personal_email}</Text>
                    ) : null}
                    {s.personal_phone ? (
                      <Text className="text-[12px] text-foreground/45">{s.personal_phone}</Text>
                    ) : null}
                  </View>

                  {s.status === 'submitted' ? (
                    <View className="mt-3 flex-row gap-2">
                      <Pressable
                        onPress={() => confirmDecline(s)}
                        disabled={decide.isPending}
                        className="h-[42px] flex-1 items-center justify-center rounded-full border border-foreground/15 active:opacity-70"
                      >
                        <Text className="text-[14px] font-semibold text-foreground/70">Decline</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => confirmApprove(s)}
                        disabled={decide.isPending}
                        className="h-[42px] flex-1 flex-row items-center justify-center rounded-full bg-foreground active:opacity-90"
                      >
                        <MaterialCommunityIcons name="check" size={18} color={`rgb(${colors.background.replace(/ /g, ',')})`} />
                        <Text className="ml-1.5 text-[14px] font-semibold text-background">Approve</Text>
                      </Pressable>
                    </View>
                  ) : s.status === 'approved' ? (
                    <Pressable
                      onPress={() => confirmCancel(s)}
                      disabled={decide.isPending}
                      className="mt-3 h-[42px] items-center justify-center rounded-full border border-red-400/40 active:opacity-70"
                    >
                      <Text className="text-[14px] font-semibold text-red-600">Take down ad</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}
