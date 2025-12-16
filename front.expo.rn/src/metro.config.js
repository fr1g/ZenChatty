const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 配置 Metro 以支持本地链接的 SDK
const projectRoot = __dirname;
const sdkRoot = path.resolve(projectRoot, '../../zencore.chatty');

// 添加 SDK 目录到监视列表
config.watchFolders = [projectRoot, sdkRoot];

// 配置解析器
config.resolver = {
  ...config.resolver,
  nodeModulesPaths: [
    path.resolve(projectRoot, 'node_modules')
  ],
  // 确保 Metro 可以解析符号链接
  resolveRequest: null,
};

module.exports = withNativeWind(config, { input: './global.css' });
