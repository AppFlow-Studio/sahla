import { useUser } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { OnboardingScaffold } from '@/src/components/onboarding/scaffold';
import { useOnboardingDraft } from '@/src/contexts/onboarding-draft-context';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useOnboardingSubmit } from '@/src/hooks/use-onboarding-submit';

const LANGUAGES = [
  'English',
  'Arabic',
  'Urdu',
  'Bengali',
  'Turkish',
  'Spanish',
  'French',
  'Bosnian',
  'Somali',
  'Other',
] as const;

export default function ConfirmScreen() {
  const router = useRouter();
  const { user } = useUser();
  const fonts = useFontFamily();
  const draft = useOnboardingDraft();
  const { colors } = useMasjidConfig();
  const submit = useOnboardingSubmit();

  const surfaceRgb = `rgb(${colors.onboardingSurface.replace(/ /g, ',')})`;
  const accentRgb = `rgb(${colors.onboardingAccent.replace(/ /g, ',')})`;
  const inputBg = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.08)`;
  const inputBorder = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.2)`;
  const placeholderColor = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.25)`;
  const labelColor = `rgba(${colors.onboardingSurface.replace(/ /g, ',')}, 0.6)`;

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState<string>('English');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  const canSubmit =
    firstName.trim().length > 0 &&
    phone.trim().length >= 7;

  // TODO: Re-enable Clerk phone verification once SMS provider is configured
  // const sendCode = useCallback(async () => {
  //   if (!user || !phone.trim()) return;
  //   setPhoneStage('sending');
  //   try {
  //     const phoneObj = await user.createPhoneNumber({ phoneNumber: phone.trim() });
  //     setPhoneRef(phoneObj);
  //     await phoneObj.prepareVerification();
  //     setPhoneStage('code_sent');
  //   } catch (err: any) {
  //     setPhoneStage('idle');
  //     const msg =
  //       err?.errors?.[0]?.longMessage ??
  //       err?.errors?.[0]?.message ??
  //       err?.message ??
  //       'Could not send code.';
  //     Alert.alert('Error', msg);
  //   }
  // }, [user, phone]);


  const handleSubmit = useCallback(async () => {
    try {
      await submit.mutateAsync({
        ...draft,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        preferredLanguage: language,
      });
      router.push('/(onboarding)/welcome-full');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Something went wrong. Please try again.');
    }
  }, [submit, draft, firstName, lastName, phone, language, router]);

  const inputStyle = {
    fontFamily: fonts.body,
    fontSize: 14,
    color: surfaceRgb,
    backgroundColor: inputBg,
    borderWidth: 1,
    borderColor: inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  };

  return (
    <OnboardingScaffold
      step={4}
      title="Confirm your details"
      primaryLabel={submit.isPending ? 'Saving...' : 'Complete'}
      onPrimary={handleSubmit}
      primaryDisabled={!canSubmit || submit.isPending}
      scrollable
      footerNote=""
    >
      <View className="mt-8" style={{ gap: 20 }}>
        {/* First Name */}
        <View>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: labelColor, marginBottom: 6 }}>
            First name
          </Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={placeholderColor}
            style={inputStyle}
          />
        </View>

        {/* Last Name */}
        <View>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: labelColor, marginBottom: 6 }}>
            Last name
          </Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name"
            placeholderTextColor={placeholderColor}
            style={inputStyle}
          />
        </View>

        {/* Phone */}
        <View>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: labelColor, marginBottom: 6 }}>
            Phone number
          </Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+1 (555) 123-4567"
            placeholderTextColor={placeholderColor}
            keyboardType="phone-pad"
            style={inputStyle}
          />
        </View>

        {/* Language */}
        <View>
          <Text style={{ fontFamily: fonts.body, fontSize: 11, color: labelColor, marginBottom: 6 }}>
            Preferred language
          </Text>
          <Pressable
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
            style={{
              ...inputStyle,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: fonts.body, fontSize: 14, color: surfaceRgb }}>
              {language}
            </Text>
            <Text style={{ color: labelColor, fontSize: 12 }}>
              {showLanguagePicker ? '\u25B2' : '\u25BC'}
            </Text>
          </Pressable>

          {showLanguagePicker && (
            <View
              style={{
                marginTop: 4,
                backgroundColor: inputBg,
                borderWidth: 1,
                borderColor: inputBorder,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang}
                  onPress={() => {
                    setLanguage(lang);
                    setShowLanguagePicker(false);
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    backgroundColor: lang === language
                      ? `rgba(${colors.onboardingAccent.replace(/ /g, ',')}, 0.15)`
                      : 'transparent',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: lang === language ? fonts.bodySemibold : fonts.body,
                      fontSize: 13,
                      color: lang === language ? accentRgb : surfaceRgb,
                      fontWeight: lang === language ? '600' : '400',
                    }}
                  >
                    {lang}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </OnboardingScaffold>
  );
}
