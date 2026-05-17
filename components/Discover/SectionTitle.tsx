import { Platform, Pressable, Text, View } from "react-native";

const BUSH = "#0A261E";
const MUTED = "rgba(10,38,30,0.6)";
const RULE = "#0A261E";

type Props = {
  title: string;
  actionLabel?: string;
  actionLeading?: React.ReactNode;
  onPressAction?: () => void;
};

const platformUiFont = Platform.select({
  ios: "SF Pro Text",
  android: "Roboto",
  default: "system-ui",
});

export default function SectionTitle({
  title,
  actionLabel,
  actionLeading,
  onPressAction,
}: Props) {
  return (
    <View className="px-5 pt-3">
      <View className="flex-row items-center justify-between pb-3">
        <Text
          style={{
            fontFamily: platformUiFont,
            fontSize: 13,
            fontWeight: "600",
            letterSpacing: 0.5,
            textTransform: "uppercase",
            color: BUSH,
          }}
        >
          {title}
        </Text>
        {actionLabel ? (
          <Pressable
            onPress={onPressAction}
            hitSlop={8}
            className="flex-row items-center gap-1"
          >
            {actionLeading}
            <Text
              style={{
                fontFamily: platformUiFont,
                fontSize: 10,
                color: MUTED,
                textTransform: "uppercase",
              }}
            >
              {actionLeading ? actionLabel : `${actionLabel} →`}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={{ height: 1, backgroundColor: RULE }} />
    </View>
  );
}
