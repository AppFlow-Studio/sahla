import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Image } from 'expo-image';
import { Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';
const PILL_BG = '#FFFFFF';
const ACTIVE_BG = '#EDEDED';

const SF_REGULAR = Platform.select({ ios: 'System', default: 'sans-serif' });

const TAB_ORDER = ['index', 'discover', 'library', 'prayer', 'profile'] as const;
type TabName = (typeof TAB_ORDER)[number];

const TAB_ICONS: Record<TabName, ReturnType<typeof require>> = {
  index: require('@/assets/images/Home_tabbar.png'),
  discover: require('@/assets/images/Discover_tabbar.png'),
  library: require('@/assets/images/Library_tabbar.png'),
  prayer: require('@/assets/images/Prayer_tabbar.png'),
  profile: require('@/assets/images/Profile_tabbar.png'),
};

const TAB_LABELS: Record<TabName, string> = {
  index: 'Home',
  discover: 'Discover',
  library: 'Library',
  prayer: 'Prayer',
  profile: 'Profile',
};

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: PILL_BG,
          borderRadius: 9999,
          paddingVertical: 4,
          paddingLeft: 4,
          paddingRight: 4,
          marginBottom: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 8,
        }}
      >
        {TAB_ORDER.map((name) => {
          const routeIndex = state.routes.findIndex((r) => r.name === name);
          if (routeIndex === -1) return null;
          const route = state.routes[routeIndex];
          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 8,
                borderRadius: 100,
                backgroundColor: isFocused ? ACTIVE_BG : 'transparent',
              }}
            >
              <Image
                source={TAB_ICONS[name]}
                style={{ width: 19, height: 19 }}
                contentFit="contain"
                tintColor={INK}
              />
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  marginTop: 2,
                  fontFamily: SF_REGULAR,
                  fontWeight: '400',
                  fontSize: 10,
                  lineHeight: 13,
                  letterSpacing: 0.06,
                  textAlign: 'center',
                  color: isFocused ? INK : INK_MUTED,
                }}
              >
                {TAB_LABELS[name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="library" options={{ title: 'Library' }} />
      <Tabs.Screen name="prayer" options={{ title: 'Prayer' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
    </Tabs>
  );
}
