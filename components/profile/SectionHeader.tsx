
import { Text, View } from "react-native";
import { useFontFamily } from '@/src/hooks/use-font-family';

type Props = {
  title: string;
};

export default function SectionHeader({ title }: Props) {
  const fonts = useFontFamily();
  return (
    <View style={{ paddingBottom: 10, paddingTop: 20 }}>
      <Text
        className="text-foreground/60"
        style={{
          fontFamily: fonts.bodySemibold,
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
