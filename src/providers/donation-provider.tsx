import { createContext, useContext, useState } from 'react';

import { DonationModal } from '@/src/components/donation-modal';

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
      <DonationModal visible={visible} onClose={() => setVisible(false)} />
    </DonationContext.Provider>
  );
}

export function useDonation() {
  const ctx = useContext(DonationContext);
  if (!ctx) throw new Error('useDonation must be used inside DonationProvider');
  return ctx;
}
