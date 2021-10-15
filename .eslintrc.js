module.exports = {
  extends: [
    'airbnb',
    // 'airbnb-typescript',
    'prettier',
  ],
  // plugins: [
  //   '@typescript-eslint',
  //   'eslint-comments',
  //   'jest',
  //   'unicorn',
  //   'react-hooks',
  // ],
  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
    jest: true,
    jasmine: true,
  },
  settings: {
    // support import modules from TypeScript files in JavaScript files
    'import/resolver': { node: { extensions: ['.js', '.jsx', '.ts', '.tsx'] } },
    polyfills: ['fetch', 'Promise', 'URL', 'object-assign'],
  },
};
