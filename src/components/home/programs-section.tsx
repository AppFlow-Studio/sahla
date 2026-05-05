import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { usePrograms } from '@/src/hooks/use-programs';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function ProgramsSection() {
  const { colors } = useMasjidConfig();
  const { programs } = usePrograms();
  const fgRgb = `rgb(${colors.foreground.replace(/ /g, ',')})`;

  if (programs.length === 0) return null;

  return (
    <View>
      <View className="flex-row items-center justify-between pb-3">
        <Text className="text-[13px] font-semibold uppercase tracking-[1px] text-foreground">
          Programs
        </Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text className="text-[10px] text-foreground/60">SEE ALL →</Text>
        </TouchableOpacity>
      </View>
      <View className="border-t border-foreground">
        {programs.map((program, index) => (
          <View
            key={program.id}
            className={`flex-row items-center py-4 ${
              index < programs.length - 1 ? 'border-b border-foreground/10' : ''
            }`}
          >
            <View className="mr-3 h-[50px] w-[50px] items-center justify-center rounded-[10px] bg-primary/10">
              <MaterialCommunityIcons
                name={program.icon as IconName}
                size={24}
                color={fgRgb}
              />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold text-foreground">
                {program.title}
              </Text>
              <Text className="mt-0.5 text-[10px] text-foreground/60">
                {program.date}
              </Text>
              <Text className="mt-0.5 text-[10px] text-accent">
                {program.category}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={`rgba(${colors.foreground.replace(/ /g, ',')},0.4)`}
            />
          </View>
        ))}
      </View>
    </View>
  );
}
