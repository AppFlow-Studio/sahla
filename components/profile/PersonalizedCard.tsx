import { IconSymbol } from "@/components/ui/icon-symbol";
import { useMasjidConfig } from "@/src/hooks/use-masjid-config";
import { Image } from "expo-image";
import { Platform, Pressable, Text, View } from "react-native";

type Props = {
    onPress: () => void;
}

export default function PersonalizedCard({ onPress }: Props) {
  const { colors } = useMasjidConfig();
  const fgRgb40 = `rgba(${colors.foreground.replace(/ /g, ",")}, 0.4)`;
  return (
    <Pressable className="w-full flex-row justify-between items-center bg-accent/20 rounded-[30px] px-5"
    style={{ minHeight: 53, paddingVertical: 12 }}
    onPress={onPress}
    >
        <View className="flex-row items-center gap-1">
            <Image
            source = {require("@/assets/images/Vector-2.png")}
            style = {{
                width: 21,
                height: 21
            }}
            contentFit="cover"
            />
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

        <IconSymbol name="chevron.right" size={8} color={fgRgb40} />
    </Pressable>
  )
}
