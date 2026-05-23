import { createContext, useContext, useState } from 'react';

type StripeAccountContextValue = {
  stripeAccountId: string | undefined;
  setStripeAccountId: (id: string | undefined) => void;
};

const StripeAccountContext = createContext<StripeAccountContextValue | null>(null);

export function StripeAccountProvider({ children }: { children: React.ReactNode }) {
  const [stripeAccountId, setStripeAccountId] = useState<string | undefined>();

  return (
    <StripeAccountContext.Provider value={{ stripeAccountId, setStripeAccountId }}>
      {children}
    </StripeAccountContext.Provider>
  );
}

export function useStripeAccount() {
  const ctx = useContext(StripeAccountContext);
  if (!ctx) throw new Error('useStripeAccount must be used inside StripeAccountProvider');
  return ctx;
}
