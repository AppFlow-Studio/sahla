module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // NOTE: Reanimated v4 (which Expo SDK 54 ships) bundles react-native-worklets
    // internally. Do NOT add `react-native-worklets/plugin` or
    // `react-native-reanimated/plugin` here — that breaks the build.
  };
};
