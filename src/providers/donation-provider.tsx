import { createContext, lazy, Suspense, useContext, useState } from 'react';

// TODO: uncomment after rebuilding dev client with Stripe native module (npx expo run:ios)
// const DonationModal = lazy(() =>
//   import('@/src/components/donation-modal').then((m) => ({ default: m.DonationModal })),
// );

type DonationContextValue = {
  open: () => void;
  close: () => void;
};

const DonationContext = createContext<DonationContextValue | null>(null);

export function DonationProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <DonationContext.Provider
      value={{
        open: () => setVisible(true),
        close: () => setVisible(false),
      }}
    >
      {children}
      {/* TODO: uncomment after rebuilding dev client with Stripe native module
      <Suspense fallback={null}>
        {visible && <DonationModal visible={visible} onClose={() => setVisible(false)} />}
      </Suspense>
      */}
    </DonationContext.Provider>
  );
}

export function useDonation() {
  const ctx = useContext(DonationContext);
  if (!ctx) throw new Error('useDonation must be used inside DonationProvider');
  return ctx;
}
