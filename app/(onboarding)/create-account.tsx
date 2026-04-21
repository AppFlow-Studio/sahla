import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Pattern from '@/assets/onboarding/pattern.svg';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';

const SERIF = 'PlayfairDisplay_500Medium';

type AuthButtonProps = {
  label: string;
  variant: 'primary' | 'secondary';
  icon?: React.ReactNode;
  onPress: () => void;
};

function AuthButton({ label, variant, icon, onPress }: AuthButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      onPress={onPress}
      className={[
        'h-10 flex-row items-center justify-center rounded-full active:opacity-80',
        isPrimary ? 'bg-onboarding-surface' : 'bg-onboarding-surface/5',
      ].join(' ')}
      style={{ gap: 8 }}
    >
      {icon}
      <Text
        className={isPrimary ? 'text-onboarding-bg' : 'text-onboarding-surface'}
        style={{ fontSize: 14, fontWeight: '500' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function CreateAccountScreen() {
  const router = useRouter();
  const config = useMasjidConfig();
  const bgHex = `rgb(${config.colors.onboardingBackground.replace(/ /g, ',')})`;
  const surfaceHex = `rgb(${config.colors.onboardingSurface.replace(/ /g, ',')})`;

  return (
    <View className="flex-1 bg-onboarding-bg">
      <View
        pointerEvents="none"
        className="absolute inset-x-0 top-0"
        style={{ height: '30%' }}
      >
        <Pattern width="100%" height="100%" preserveAspectRatio="xMidYMin slice" />
      </View>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-1 justify-center" style={{ paddingHorizontal: 55 }}>
          <Text
            className="text-onboarding-surface"
            style={{
              fontFamily: SERIF,
              fontSize: 30,
              fontWeight: '500',
              textAlign: 'center',
              marginBottom: 36,
            }}
          >
            Create Account
          </Text>

          <View style={{ gap: 16 }}>
            <AuthButton
              label="Continue with Apple"
              variant="primary"
              icon={<Ionicons name="logo-apple" size={14} color={bgHex} />}
              onPress={() => router.push('/(onboarding)/name')}
            />
            <AuthButton
              label="Continue with Google ID"
              variant="secondary"
              icon={<Ionicons name="logo-google" size={12} color={surfaceHex} />}
              onPress={() => router.push('/(onboarding)/name')}
            />
            <AuthButton
              label="Continue with Email"
              variant="secondary"
              onPress={() => router.push('/(onboarding)/name')}
            />
          </View>

          <View className="mt-8 items-center">
            <Text className="text-onboarding-surface/20" style={{ fontSize: 10 }}>
              By continuing you agree to our Terms of Service & privacy policy
            </Text>
            <View className="mt-1.5 flex-row">
              <Text className="text-onboarding-surface/60" style={{ fontSize: 10 }}>
                Already have an account?{' '}
              </Text>
              <Link
                href="/(auth)/sign-in"
                className="text-onboarding-accent"
                style={{ fontSize: 10, fontWeight: '500' }}
              >
                Sign in
              </Link>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
