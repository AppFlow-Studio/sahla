import { IconSymbol } from "@/components/ui/icon-symbol";
import { Image } from "expo-image";
import { Platform, Pressable, Text, View } from "react-native";

type Props = {
    onPress: () => void;
}

export default function PersonalizedCard({ onPress }: Props) {
  return (
    <Pressable className="py-3 w-full flex-row justify-between items-center bg-[#B8922A33] rounded-full px-4"
    onPress={onPress}
    >
        <View className="flex-row items-center gap-2">
            <Image
            source = {require("@/assets/images/Vector-2.png")}
            style = {{
                width: 21,
                height: 21
            }}
            contentFit="cover"
            />
            <View className="flex-col gap-1">
                <Text
                style = {{
                    fontFamily: Platform.select({ android: "Roboto", default: undefined }),
                    fontWeight: "600",
                    fontSize: 11,
                    lineHeight: 18,
                    color: "#0A261E",
                    letterSpacing: 0,
                    
                }}
                >
                Personalize Preferences
                </Text>
                <Text
                style = {{
                    fontFamily: Platform.select({ android: "Roboto", default: undefined }),
                    fontWeight: "400",
                    fontSize: 10,
                    lineHeight: 18,
                    color: "#0A261E99",
                    letterSpacing: 0,
                }}
                >
                    Get your content recommended just for you
                </Text>

            </View>


        </View>

        <IconSymbol name="chevron.right" size={16} color="#0A261E99" />

    </Pressable>
  )
}
