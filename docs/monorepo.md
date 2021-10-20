# cra 实现

## 从 monorepo 开始

- [monorepo](https://juejin.cn/post/6950561371394146318)
- [yarn workspace](https://classic.yarnpkg.com/lang/en/docs/workspaces/)
- [lerna](https://github.com/lerna/lerna)

- 创建本项目

```bash
  # 全局安装 lerna
  yarn global add lerna
  # 创使用独立模式建本项目
  mkdir demo && cd demo && lerna init --independent
  # 创建 cra 子项目
  lerna create cra --yes && touch packages/cra/index.js
```

使用 yarn workspace _lerna.json_

```json
{
  // ...
  "npmClient": "yarn",
  "useWorkspaces": true
}
```

_package.json_

```json
{
  // ...
  "workspaces": ["packages/*"]
}
```

给 cra 配置 bin _packages/cra/package.json_

```json
{
  // ...
  "engines": {
    "node": ">=14"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/Mackkkk/ALL.git",
    "directory": "packages/cra"
  },
  "files": ["index.js", "lib"],
  "bin": {
    "cra": "./index.js"
  }
}
```

添加 husky，配置 commitlint

- [husky](https://typicode.github.io/husky/#/)
- [commitlint](https://commitlint.js.org/#/)

_package.json_

```json
{
  "scripts": {
    // ...
    "commit": "git add -A && git-cz"
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
    "@typescript-eslint/parser": "^4.29.3",
    "commitizen": "^4.2.4",
    "inquirer": "^8.2.0",
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

_package.json_

```json
{
  "lint-staged": {
    "**.*": ["prettier --write", "git add"],
    "**/.*{css,scss,less}": "stylelint",
    "*.{js,jsx,ts,jsx}": "eslint . --ext .js,.jsx,.ts,.tsx"
  },
  "devDependencies": {
    // ...
    "eslint": "^7.5.0",
    "eslint-config-airbnb": "^18.2.1",
    "eslint-config-airbnb-typescript": "^14.0.1",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-import": "^2.25.2",
    "eslint-plugin-jest": "^25.2.2",
    "eslint-plugin-jsx-a11y": "^6.4.1",
    "eslint-plugin-react": "^7.26.1",
    "eslint-plugin-react-hooks": "^4.2.0",
    "eslint-plugin-unicorn": "^20.0.0",
    "lint-staged": "^11.2.3",
    "prettier": "^2.4.1",
    "stylelint": "^13.13.1",
    "stylelint-config-css-modules": "^2.2.0",
    "stylelint-config-prettier": "^9.0.3",
    "stylelint-config-standard": "^22.0.0",
    "stylelint-declaration-block-no-ignored-properties": "^2.4.0",
    "typescript": "^4.4.4"
  }
}
```

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

_.eslintignore_

```
**/.husky
**/node_modules
**/build
**/.husky
**/.eslintrc.js
**/.stylelintrc.js
**/.prettierrc.js
```

_.eslintrc.json_

```json
{
  "extends": ["airbnb", "airbnb-typescript", "prettier"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["react", "jest", "unicorn", "react-hooks", "import"],
  "env": {
    "browser": true,
    "node": true,
    "es6": true,
    "mocha": true,
    "jest": true,
    "jasmine": true
  },
  "settings": {
    "import/resolver": {
      "node": {
        "extensions": [".js", ".jsx", ".ts", ".tsx", ".d.ts"]
      }
    },
    "import/parsers": {
      "@typescript-eslint/parser": [".ts", ".tsx", ".d.ts"]
    },
    "import/extensions": [
      ".js",
      ".mjs",
      ".jsx",
      ".ts",
      ".tsx",
      ".d.ts"
    ],
    "import/external-module-folders": [
      "node_modules",
      "node_modules/@types"
    ],
    "polyfills": ["fetch", "Promise", "URL", "object-assign"]
  },
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "requireConfigFile": false,
    "project": "./tsconfig.json"
  },
  "rules": {
    "@typescript-eslint/no-unused-vars": "off"
  }
}
```

_.prettierignore_

```
**/node_modules
```

_.prettierrc.json_

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "proseWrap": "never"
}
```

_tsconfig.json_

```json
{
  "compilerOptions": {
    "outDir": "build/dist",
    "module": "esnext",
    "target": "esnext",
    "lib": ["esnext", "dom"],
    "sourceMap": true,
    "baseUrl": ".",
    "jsx": "react",
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "moduleResolution": "node",
    "forceConsistentCasingInFileNames": true,
    "noImplicitReturns": true,
    "suppressImplicitAnyIndexErrors": true,
    "noUnusedLocals": true,
    "allowJs": true,
    "skipLibCheck": true,
    "experimentalDecorators": true,
    "strict": true,
    "paths": {
      "@/*": ["./packages/*"]
    }
  },
  "include": ["./packages/**/*"],
  "exclude": [
    "node_modules",
    "build",
    "dist",
    "scripts",
    "webpack",
    "jest"
  ]
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
