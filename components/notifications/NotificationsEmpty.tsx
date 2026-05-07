import { Image, Platform, Pressable, Text, View } from 'react-native';

const BELL_PNG = require('@/assets/images/notifcation_bell_for_notification_screen.png');

const INK = '#0A261E';
const INK_MUTED = 'rgba(10,38,30,0.6)';
const SURFACE = '#FFFBF2';

const PLAYFAIR = Platform.select({
  ios: 'PlayfairDisplay-Medium',
  default: 'PlayfairDisplay_500Medium',
});

type Props = {
  masjidName: string;
  onEnablePress?: () => void;
};

export function NotificationsEmpty({ masjidName, onEnablePress }: Props) {
  return (
    <View style={{ alignItems: 'center', paddingHorizontal: 24, paddingTop: 24 }}>
      <Image
        source={BELL_PNG}
        style={{ width: 160, height: 160 }}
        resizeMode="contain"
      />

      <Text
        style={{
          fontFamily: PLAYFAIR,
          fontWeight: '500',
          fontSize: 25,
          lineHeight: 32,
          color: INK,
          textAlign: 'center',
        }}
      >
        No notifications yet
      </Text>

      <Text
        style={{
          marginTop: 12,
          maxWidth: 280,
          fontSize: 13,
          lineHeight: 18,
          color: INK_MUTED,
          textAlign: 'center',
        }}
      >
        You'll get updates here for prayer times, events you RSVP to, and
        community announcements from {masjidName}.
      </Text>

      <View
        style={{
          marginTop: 28,
          width: '100%',
          paddingHorizontal: 40,
          alignItems: 'stretch',
        }}
      >
        <Pressable
          onPress={onEnablePress}
          style={{
            height: 43,
            borderRadius: 50,
            backgroundColor: INK,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            style={{
              color: SURFACE,
              fontSize: 14,
              fontWeight: '600',
            }}
          >
            Enable Push Notifications
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
