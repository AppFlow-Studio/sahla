import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import Mandala from '@/assets/onboarding/mandala.svg';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { syncOnboardingToClerk } from '@/src/hooks/use-onboarding-sync';
import { useSupabase } from '@/src/hooks/use-supabase';
import { useOnboardingStore } from '@/src/stores/onboarding-store';

const SERIF = 'CormorantGaramond_400Regular';

const MANDALA_SIZE = 402;
const HALO_SIZE = 324;
const DISC_RADIUS = 112;

function GoldHalo() {
  return (
    <Svg width={HALO_SIZE} height={HALO_SIZE} viewBox="0 0 324 324">
      <Defs>
        <RadialGradient id="haloGlow" cx="162" cy="162" r="162" gradientUnits="userSpaceOnUse">
          <Stop offset="0.62" stopColor="#B8922A" stopOpacity="0" />
          <Stop offset="0.72" stopColor="#B8922A" stopOpacity="0.22" />
          <Stop offset="0.88" stopColor="#B8922A" stopOpacity="0.05" />
          <Stop offset="1" stopColor="#B8922A" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="162" cy="162" r="162" fill="url(#haloGlow)" />
      <Circle cx="162" cy="162" r={DISC_RADIUS} fill="#0A261E" />
    </Svg>
  );
}

export default function WelcomeFullScreen() {
  const router = useRouter();
  const config = useMasjidConfig();
  const { user } = useUser();
  const supabase = useSupabase();
  const storedName = useOnboardingStore((s) => s.firstName);
  const markComplete = useOnboardingStore((s) => s.markComplete);
  const firstName = storedName.trim().split(/\s+/)[0] || 'Friend';
  const [finishing, setFinishing] = useState(false);

  return (
    <View className="flex-1 bg-onboarding-layer">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center">
          <View
            style={{
              width: MANDALA_SIZE,
              height: MANDALA_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ position: 'absolute' }}>
              <Mandala width={MANDALA_SIZE} height={MANDALA_SIZE} />
            </View>

            <View
              style={{
                width: HALO_SIZE,
                height: HALO_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View style={{ position: 'absolute' }}>
                <GoldHalo />
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.5)' }}>
                  You&rsquo;re all set
                </Text>

                <View style={{ marginTop: 18, alignItems: 'center' }}>
                  <Text
                    className="text-onboarding-surface"
                    style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 35 }}
                  >
                    Welcome
                  </Text>
                  <Text
                    className="text-onboarding-surface"
                    style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 35 }}
                  >
                    {firstName}
                  </Text>
                </View>

                <Text
                  className="text-onboarding-accent"
                  style={{ fontSize: 12, marginTop: 18 }}
                >
                  {config.displayName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 59, paddingBottom: 24 }}>
          <Pressable
            onPress={async () => {
              if (finishing) return;
              setFinishing(true);
              try {
                // Sync onboarding status to Clerk publicMetadata (per-org)
                if (user) {
                  await syncOnboardingToClerk(user, config.clerkOrgId, storedName.trim(), supabase);
                  // Refresh the local Clerk user object so publicMetadata is up-to-date
                  await user.reload();
                }
              } catch (err) {
                console.warn('[welcome-full] Sync error (non-fatal):', err);
              }
              // Mark complete locally — guards redirect to (main)
              markComplete();
              router.replace('/(main)');
            }}
            disabled={finishing}
            className="h-[37px] items-center justify-center rounded-full bg-onboarding-surface active:opacity-90"
          >
            {finishing ? (
              <ActivityIndicator size="small" color="#0A261E" />
            ) : (
              <Text
                className="text-onboarding-bg"
                style={{ fontSize: 14, fontWeight: '600' }}
              >
                Enter
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
