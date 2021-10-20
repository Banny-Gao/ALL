module.exports = {
  parserPreset: 'conventional-changelog-conventionalcommits',
  extends: [
    '@commitlint/config-conventional',
    '@commitlint/config-lerna-scopes',
  ],
  formatter: '@commitlint/format',
  defaultIgnores: true,
};
