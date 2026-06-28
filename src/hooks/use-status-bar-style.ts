import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle, type StatusBarStyle } from 'expo-status-bar';
import { useCallback } from 'react';

/**
 * Reasserts the status bar style whenever this screen gains focus.
 *
 * The native bottom tabs keep every screen mounted, so the declarative
 * <StatusBar> component is unreliable — whichever tab mounted last wins and it
 * never updates on tab switch. Setting it on focus fixes that, as long as every
 * tab uses this hook (each focus overrides the previous tab's choice).
 */
export function useStatusBarStyle(style: StatusBarStyle) {
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle(style);
    }, [style]),
  );
}
