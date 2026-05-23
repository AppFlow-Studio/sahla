
import { Platform, Text, View } from "react-native";

type Props = {
  title: string;
};

export default function SectionHeader({ title }: Props) {
  return (
    <View style={{ paddingBottom: 10, paddingTop: 20 }}>
      <Text
        className="text-foreground/60"
        style={{
          fontFamily: Platform.select({ android: 'Roboto', default: undefined }),
          fontWeight: '700',
          fontSize: 10,
          lineHeight: 14,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
    </View>
  );
}
