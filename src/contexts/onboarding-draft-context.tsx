import { createContext, useCallback, useContext, useState } from 'react';

export type OnboardingDraft = {
  lifeStages: string[];
  selectedInterestKeys: string[];
  knowledgeLevel: string | null;
  phone: string | null;
  preferredLanguage: string | null;
};

type OnboardingDraftContextValue = OnboardingDraft & {
  toggleLifeStage: (value: string) => void;
  setSelectedInterestKeys: (keys: string[]) => void;
  toggleInterestKey: (key: string) => void;
  setKnowledgeLevel: (value: string) => void;
  setPhone: (value: string) => void;
  setPreferredLanguage: (value: string) => void;
};



const OnboardingDraftContext = createContext<OnboardingDraftContextValue | null>(null);

export function OnboardingDraftProvider({ children }: { children: React.ReactNode }) {
  const [lifeStages, setLifeStages] = useState<string[]>([]);
  const [selectedInterestKeys, setSelectedInterestKeys] = useState<string[]>([]);
  const [knowledgeLevel, setKnowledgeLevel] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(null);

  const toggleLifeStage = useCallback((key: string) => {
    setLifeStages((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  }, []);

  const toggleInterestKey = useCallback((key: string) => {
    setSelectedInterestKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      return [...prev, key];
    });
  }, []);

  return (
    <OnboardingDraftContext.Provider
      value={{
        lifeStages,
        selectedInterestKeys,
        knowledgeLevel,
        phone,
        preferredLanguage,
        toggleLifeStage,
        setSelectedInterestKeys,
        toggleInterestKey,
        setKnowledgeLevel,
        setPhone,
        setPreferredLanguage,
      }}
    >
      {children}
    </OnboardingDraftContext.Provider>
  );
}

export function useOnboardingDraft(): OnboardingDraftContextValue {
  const ctx = useContext(OnboardingDraftContext);
  if (!ctx) throw new Error('useOnboardingDraft must be used within OnboardingDraftProvider');
  return ctx;
}
