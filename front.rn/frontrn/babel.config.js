export default function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset', "nativewind/babel"],
  };
};