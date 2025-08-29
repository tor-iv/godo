module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo'],
      ['@babel/preset-react', { runtime: 'automatic' }],
      ['@babel/preset-typescript'],
    ],
    plugins: [
      '@babel/plugin-proposal-export-namespace-from',
      'react-native-reanimated/plugin',
    ],
    env: {
      test: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          ['@babel/preset-typescript'],
        ],
        plugins: [
          '@babel/plugin-proposal-export-namespace-from',
        ],
      },
    },
  };
};