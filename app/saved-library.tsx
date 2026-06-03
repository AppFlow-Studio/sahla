import Saved_Events from '@/components/Saved_Programs_and_Events/Saved_Events';

// Root-level full-screen route for the saved library, so opening it from the
// content sheet's toast doesn't deep-link into (and get stuck in) the Profile
// tab. The component renders its own header + back.
export default function SavedLibraryScreen() {
  return <Saved_Events />;
}
