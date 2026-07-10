const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.useWatchman = false;

const defaultBlockList = config.resolver.blockList;
const extraBlocks = [
  /\.expo[\\/]types/,
  /node_modules[\\/].*[\\/]prebuilds[\\/].*/,
  /node_modules[\\/].*[\\/].*\.xcframework[\\/].*/,
  /node_modules[\\/].*[\\/].*\.framework[\\/].*/,
];

config.resolver.blockList = Array.isArray(defaultBlockList)
  ? [...defaultBlockList, ...extraBlocks]
  : [defaultBlockList, ...extraBlocks];

module.exports = config;
