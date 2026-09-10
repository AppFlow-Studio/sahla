import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useDonation } from '@/src/providers/donation-provider';

/**
 * Rendered with MaterialCommunityIcons rather than the shared `Icon` wrapper:
 * these are MCI's solid glyphs (MCI's convention is that the bare name is
 * filled and `-outline` is the stroked variant), which is what v2 shows. The
 * shared wrapper maps the same names onto Lucide, whose glyphs are outline-only.
 */
const QUICK_ACTIONS = [
  { id: 'donate', icon: 'heart' },
  { id: 'volunteer', icon: 'account-group' },
  { id: 'advertise', icon: 'bullhorn' },
  { id: 'prayers', icon: 'clock' },
  { id: 'quran', icon: 'book-open-variant' },
] as const;

export function QuickActions() {
  const { t } = useTranslation();
  const { colors } = useMasjidConfig();
  const { open: openDonation } = useDonation();
  const router = useRouter();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;
  const primaryRgb = `rgb(${colors.primary.replace(/ /g, ',')})`;

  const handlePress = (id: string) => {
    if (id === 'donate') openDonation();
    else if (id === 'prayers') router.push('/prayer');
    else if (id === 'advertise') router.push('/advertise');
    else if (id === 'quran') router.push('/quran');
  };

  return (
    <View className="flex-row justify-between">
      {QUICK_ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.id}
          className="flex-1 items-center"
          activeOpacity={0.7}
          onPress={() => handlePress(action.id)}
        >
          {/* v2 (Figma node 365:4226): the label lives inside the 62×62 tile
              under the icon, in sentence case — it used to sit below the tile
              in uppercase. */}
          <View
            className="items-center justify-center rounded-2xl border border-foreground/10 bg-muted"
            style={{
              height: 62,
              width: 62,
              paddingHorizontal: 3,
              shadowColor: fgRgb,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.02,
              shadowRadius: 14,
              elevation: 1,
            }}
          >
            <MaterialCommunityIcons
              name={action.icon}
              size={20}
              color={primaryRgb}
            />
            <Text
              // Longer translations ("رضاکارانہ خدمت" for volunteer) would
              // overflow a 62px tile, so shrink to fit rather than ellipsize.
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              className="mt-[5px] text-[10px] font-semibold text-foreground/70"
            >
              {t(`quickActions.${action.id}`)}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}
