import { Platform, Pressable, Text, View } from "react-native";

import { Icon } from "@/src/components/ui/icon";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";

type Props = {
    onPress: () => void;
}

export default function PersonalizedCard({ onPress }: Props) {
  const { colors } = useMasjidConfig();
  const fg = `rgb(${colors.foreground.replace(/ /g, ",")})`;
  const fg40 = `rgba(${colors.foreground.replace(/ /g, ",")},0.4)`;
  return (
    <Pressable className="w-full flex-row justify-between items-center bg-accent/20 rounded-[30px] px-5"
    style={{ minHeight: 53, paddingVertical: 12 }}
    onPress={onPress}
    >
        <View className="flex-row items-center gap-1">
            {/* Themed vector (was a baked-in gold PNG) so it follows the masjid palette. */}
            <Icon name="white-balance-sunny" size={21} color={fg} />
            <View className="flex-col ml-2">
                <Text
                className="text-foreground"
                style = {{
                    fontFamily: Platform.select({ android: "Roboto", default: undefined }),
                    fontWeight: "600",
                    fontSize: 11,
                    lineHeight: 18,
                    letterSpacing: 0,
                }}
                >
                Personalize Preferences
                </Text>
                <Text
                className="text-foreground/60"
                style = {{
                    fontFamily: Platform.select({ android: "Roboto", default: undefined }),
                    fontWeight: "400",
                    fontSize: 10,
                    lineHeight: 18,
                    letterSpacing: 0,
                }}
                >
                    Get your content recommended just for you
                </Text>
            </View>
        </View>

        <Icon name="chevron-right" size={14} color={fg40} />
    </Pressable>
  )
}
