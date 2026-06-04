import { NotificationSettings } from '@/components/notifications/NotificationSettings';

// Root-level full-screen route for reminder settings, so opening it from the
// content sheet's toast doesn't deep-link into (and get stuck in) the Profile
// tab. The component renders its own header + back.
export default function RemindersSettingsScreen() {
  return <NotificationSettings />;
}
