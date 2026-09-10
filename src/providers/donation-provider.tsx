import { createContext, lazy, Suspense, useContext, useState } from 'react';

const DonationModal = lazy(() =>
  import('@/src/components/donation-modal').then((m) => ({ default: m.DonationModal })),
);

type DonationContextValue = {
  open: () => void;
  close: () => void;
};

const DonationContext = createContext<DonationContextValue | null>(null);

export function DonationProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  // Stays true after the first open so the modal can run its OWN close
  // animation when `visible` flips false. The earlier `{visible && ...}`
  // unmounted the modal synchronously on close, which killed the spring
  // mid-flight and made the sheet snap off-screen. The DonationModal
  // self-unmounts (returns null) once its internal `mounted` state flips
  // — see the resetState() call after the close animation completes.
  const [everOpened, setEverOpened] = useState(false);

  return (
    <DonationContext.Provider
      value={{
        open: () => {
          setEverOpened(true);
          setVisible(true);
        },
        close: () => setVisible(false),
      }}
    >
      {children}
      <Suspense fallback={null}>
        {everOpened && <DonationModal visible={visible} onClose={() => setVisible(false)} />}
      </Suspense>
    </DonationContext.Provider>
  );
}

export function useDonation() {
  const ctx = useContext(DonationContext);
  if (!ctx) throw new Error('useDonation must be used inside DonationProvider');
  return ctx;
}
