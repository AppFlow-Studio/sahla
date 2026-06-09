import Constants from 'expo-constants';

export function useAppVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}
