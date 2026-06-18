module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // react-native-reanimated 4.x relies on the worklets babel plugin.
    // It MUST be listed last.
    plugins: ['react-native-worklets/plugin'],
  };
};
