
import { Platform, Text, View } from "react-native";

type Props = {
  title: string;
};

export default function SectionHeader({ title }: Props) {
  return (
    <View className="pb-2 pt-4">
      <Text
        style={{
          fontFamily: Platform.select({ android: 'Roboto', default: undefined }),
          fontWeight: '700',
          fontSize: 10,
          lineHeight: 10,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color: '#0A261E99',
        }}
      >
        {title}
      </Text>
    </View>
  );
}