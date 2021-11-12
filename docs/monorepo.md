# Monorepo 搭建项目

- [monorepo](https://juejin.cn/post/6950561371394146318)

## lerna 与 yarn workspace

- [yarn workspace](https://classic.yarnpkg.com/lang/en/docs/workspaces/)
- [lerna](https://github.com/lerna/lerna)

- 创建本项目

```bash
  # 全局安装 lerna
  yarn global add lerna
  # 创使用独立模式建本项目
  mkdir demo && cd demo && lerna init --independent
  # 创建一个子项目
  lerna create cra --yes && touch packages/cra/index.js
```

配合 yarn workspace 使用 _lerna.json_

```json
{
  // ...
  "npmClient": "yarn",
  "useWorkspaces": true
}
```

指定 workspaces

_package.json_

```json
{
  // ...
  "private": true,
  "workspaces": ["packages/*"]
}
```

## 配置 lint

添加 husky，配置 commitlint, 自动生成 CHANGELOG

- [husky](https://typicode.github.io/husky/#/)
- [commitlint](https://commitlint.js.org/#/)

_package.json_

```json
{
  "scripts": {
    // ...
    "cz": "prettier -c -w . && git add -A && git-cz",
    "changelog": "conventional-changelog -p conventionalcommits -i CHANGELOG.md -s"
  },
  "config": {
    "commitizen": {
      "path": "@commitlint/cz-commitlint"
    }
  },
  "devDependencies": {
    // ...
    "@commitlint/cli": "^13.2.1",
    "@commitlint/config-conventional": "^13.2.0",
    "@commitlint/config-lerna-scopes": "^13.2.0",
    "@commitlint/cz-commitlint": "^13.2.1",
    "@commitlint/format": "^13.2.0",
    "commitizen": "^4.2.4",
    "conventional-changelog": "^3.1.24",
    "conventional-changelog-conventionalcommits": "^4.6.1",
    "husky": "^7.0.2"
  }
}
```

_commitlint.config.js_

```js
module.exports = {
  parserPreset: 'conventional-changelog-conventionalcommits',
  extends: [
    '@commitlint/config-conventional',
    '@commitlint/config-lerna-scopes',
  ],
  formatter: '@commitlint/format',
  defaultIgnores: true,
};
```

配置 eslint 、 stylelint 和 prettier

```bash
yarn husky add .husky/pre-commit 'yarn lint-staged'
```

使用 [typescript-eslint](https://typescript-eslint.io/docs/) 基于 [standard](https://www.npmjs.com/package/eslint-config-standard-with-typescript) 配置

_package.json_

```json
{
  "scripts": {
    // ...
    "eslint": "eslint packages --ext .js,.jsx,.ts,.tsx --fix"
  },
  "lint-staged": {
    "**/.*{css,scss,less}": "stylelint",
    "*.{js,jsx,ts,jsx}": "eslint --ext .js,.jsx,.ts,.tsx"
  },
  "devDependencies": {
    // ...
    "eslint": "^8.2.0",
    "eslint-config-prettier": "^8.3.0",
    "eslint-config-standard-with-typescript": "^21.0.1",
    "eslint-plugin-import": "^2.25.3",
    "eslint-plugin-jest": "^25.2.4",
    "eslint-plugin-node": "^11.1.0",
    "eslint-plugin-promise": "^5.1.1",
    "eslint-plugin-react": "^7.27.0",
    "jest": "^27.3.1",
    "lint-staged": "^11.2.3",
    "prettier": "^2.4.1",
    "typescript": "^4.4.4",
    "stylelint": "^13.13.1",
    "stylelint-config-css-modules": "^2.2.0",
    "stylelint-config-prettier": "^9.0.3",
    "stylelint-config-standard": "^22.0.0",
    "stylelint-declaration-block-no-ignored-properties": "^2.4.0"
  }
}
```

_.eslintrc.js_

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest', 'import', 'react'],
  extends: [
    'standard-with-typescript',
    'prettier',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
    mocha: true,
    jest: true,
    jasmine: true,
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts'],
      },
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
    },
    'import/extensions': [
      '.js',
      '.mjs',
      '.jsx',
      '.ts',
      '.tsx',
      '.d.ts',
    ],
    'import/external-module-folders': [
      'node_modules',
      'node_modules/@types',
    ],
  },
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json', './packages/*/tsconfig.json'],
    extraFileExtensions: ['.vue'],
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    'no-console': 'warn',
    'no-restricted-syntax': 'off',
    'no-undef': 'off',
    'no-cond-assign': 'off',
    'prefer-promise-reject-errors': 'off',
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
    'no-bitwise': 'off',
    'no-param-reassign': 'off',
    'consistent-return': 'off',
    'class-methods-use-this': 'off',
    'max-classes-per-file': 'off',
    'no-underscore-dangle': 'off',
    'no-nested-ternary': 'off',
  },
};
```

_tsconfig.json_

```json
{
  "compilerOptions": {
    "rootDir": "./",
    "module": "esnext",
    "target": "esnext",
    "lib": ["esnext", "dom"],
    "sourceMap": true,
    "baseUrl": ".",
    "jsx": "react",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "forceConsistentCasingInFileNames": true,
    "noImplicitReturns": true,
    "suppressImplicitAnyIndexErrors": true,
    "noUnusedLocals": true,
    "allowJs": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "strict": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./packages/*"]
    }
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "build", "jest"]
}
```

monorepo 的特殊配置

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["packages"]
}
```

_.eslintignore_

```
**/.husky
**/node_modules
**/build
**/.husky
**/scripts
**/*.d.ts

.eslintrc.js
commitlint.config.js
```

配置 prettier

_.editorconfig_

```
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
max_line_length = 80
trim_trailing_whitespace = true

[*.md]
max_line_length = 0
trim_trailing_whitespace = false

[COMMIT_EDITMSG]
max_line_length = 0
```

_.prettierignore_

```
**/node_modules
```

_.prettierrc.json_

```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 72,
  "proseWrap": "never",
  "endOfLine": "lf"
}
```

_.stylelintrc.json_

```json
{
  "extends": [
    "stylelint-config-standard",
    "stylelint-config-css-modules",
    "stylelint-config-prettier"
  ],
  "plugins": ["stylelint-declaration-block-no-ignored-properties"],
  "rules": {
    "no-descending-specificity": null,
    "function-calc-no-invalid": null,
    "function-url-quotes": "always",
    "selector-attribute-quotes": "always",
    "font-family-no-missing-generic-family-keyword": null,
    "plugin/declaration-block-no-ignored-properties": true,
    "unit-no-unknown": [
      true,
      {
        "ignoreUnits": ["rpx"]
      }
    ],
    "selector-type-no-unknown": null,
    "value-keyword-case": [
      "lower",
      {
        "ignoreProperties": ["composes"]
      }
    ]
  },
  "ignoreFiles": ["**/*.js", "**/*.jsx", "**/*.tsx", "**/*.ts"]
}
```

## Tips

- [workspaces](https://classic.yarnpkg.com/en/docs/cli/workspaces) 与 [workspace](https://classic.yarnpkg.com/en/docs/cli/workspace)
  - root 添加 package, **yarn add package -W**
  - workspace 添加 package, **yarn workspace cra add package**, 也可以使用 **lerna add package --scope cra**
- 使用 **lerna bootstrap** 或 **yarn** 给所有 **workspace** 添加依赖
- 使用 **lerna clean** 清除 **workspace** 的 _node_modules_
