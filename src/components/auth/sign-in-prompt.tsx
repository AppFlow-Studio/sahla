import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, Text, View } from 'react-native';

import { Icon } from '@/src/components/ui/icon';
import { Tappable } from '@/src/components/ui/tappable';
import { useFontFamily } from '@/src/hooks/use-font-family';
import { useMasjidConfig } from '@/src/hooks/use-masjid-config';
import { useGuestStore } from '@/src/stores/guest-store';

/** What the guest was trying to do — picks the line shown in the sheet. */
export type GatedAction = 'save' | 'like' | 'notify' | 'profile' | 'generic';

type Ctx = {
  /**
   * Returns true when the action may proceed. When browsing as a guest it
   * returns false and raises the sign-in sheet instead, so call sites read:
   *
   *   if (!requireAccount('save')) return;
   */
  requireAccount: (action?: GatedAction) => boolean;
};

const SignInPromptContext = createContext<Ctx | null>(null);

/**
 * Guests can browse the whole app, but anything tied to a person needs an
 * account. Rather than hiding those controls — which makes the app look
 * thinner than it is, to reviewers and to real users alike — they stay visible
 * and explain themselves on tap.
 */
export function SignInPromptProvider({ children }: { children: ReactNode }) {
  const isGuest = useGuestStore((s) => s.isGuest);
  const [action, setAction] = useState<GatedAction | null>(null);

  const requireAccount = useCallback(
    (next: GatedAction = 'generic') => {
      if (!isGuest) return true;
      setAction(next);
      return false;
    },
    [isGuest],
  );

  const value = useMemo(() => ({ requireAccount }), [requireAccount]);

  return (
    <SignInPromptContext.Provider value={value}>
      {children}
      <SignInPromptSheet action={action} onDismiss={() => setAction(null)} />
    </SignInPromptContext.Provider>
  );
}

export function useRequireAccount(): Ctx['requireAccount'] {
  const ctx = useContext(SignInPromptContext);
  if (!ctx) throw new Error('useRequireAccount must be used inside <SignInPromptProvider>');
  return ctx.requireAccount;
}

function SignInPromptSheet({
  action,
  onDismiss,
}: {
  action: GatedAction | null;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const fonts = useFontFamily();
  const { colors } = useMasjidConfig();
  const exitGuest = useGuestStore((s) => s.exitGuest);

  const fg = colors.foreground.replace(/ /g, ',');
  const accentRgb = `rgb(${colors.accent.replace(/ /g, ',')})`;
  const fgRgb = `rgb(${fg})`;
  const bgRgb = `rgb(${colors.background.replace(/ /g, ',')})`;

  if (!action) return null;

  const handleSignIn = () => {
    onDismiss();
    // Leaving guest mode flips the navigator's guard back to the auth group,
    // which lands on welcome — no explicit navigation needed, and no chance of
    // pushing a route the guard is about to unmount.
    exitGuest();
  };

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={onDismiss}>
      <Pressable
        onPress={onDismiss}
        style={{ flex: 1, backgroundColor: `rgba(${fg},0.35)`, justifyContent: 'flex-end' }}
      >
        {/* Stop taps inside the card from closing it. */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: bgRgb,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 40,
          }}
        >
          <View style={{ alignItems: 'center' }}>
            <View style={{ height: 4, width: 36, borderRadius: 2, backgroundColor: `rgba(${fg},0.15)` }} />
          </View>

          <View style={{ alignItems: 'center', marginTop: 22 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: `rgba(${fg},0.06)`,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="person-outline" size={24} color={fgRgb} />
            </View>

            <Text
              style={{
                marginTop: 18,
                fontSize: 20,
                lineHeight: 27,
                textAlign: 'center',
                color: fgRgb,
                fontFamily: fonts.displayRegular,
              }}
            >
              {t(`auth.gate.${action}Title`)}
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                lineHeight: 21,
                textAlign: 'center',
                color: `rgba(${fg},0.55)`,
                maxWidth: 300,
              }}
            >
              {t(`auth.gate.${action}Body`)}
            </Text>
          </View>

          <Tappable
            onPress={handleSignIn}
            style={{
              marginTop: 26,
              height: 48,
              borderRadius: 24,
              backgroundColor: accentRgb,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: '600', color: bgRgb }}>
              {t('auth.gate.signIn')}
            </Text>
          </Tappable>

          <Tappable
            onPress={onDismiss}
            style={{ marginTop: 10, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 14, fontWeight: '500', color: `rgba(${fg},0.5)` }}>
              {t('auth.gate.notNow')}
            </Text>
          </Tappable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
