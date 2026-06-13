const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};
config.resolver = {
  ...resolver,
  // `.qsvg` is the mushaf-page bundle (under assets/mushaf-svg/). The custom
  // extension keeps these files in the asset pipeline (giving us a localUri
  // we can read at runtime) instead of being transformed into React
  // components by react-native-svg-transformer like the ornament .svg files.
  assetExts: [
    ...resolver.assetExts.filter((ext) => ext !== 'svg'),
    'db',
    'sqlite',
    'qsvg',
  ],
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = withNativeWind(config, { input: './global.css' });
