import { Platform, ScrollView } from 'react-native';
import ProfileHeader from '@/components/profile/ProfileHeader';

export default function ProfileScreen() {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'never' : undefined}
    >
      <ProfileHeader />
    </ScrollView>
  );
}
