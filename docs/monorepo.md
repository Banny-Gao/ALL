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

使用 yarn workspace
_lerna.json_

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

给 cra 配置 bin
_packages/cra/package.json_

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
}
```

配置 eslint 和 prettier

*package.json*
```json
{
  "devDependencies": {
    // ...
    "eslint": "7.2.0",
    "eslint-config-airbnb": "^18.2.1",
    "eslint-config-prettier": "^8.3.0",
    "eslint-plugin-import": "^2.25.2",
    "eslint-plugin-jsx-a11y": "^6.4.1",
    "eslint-plugin-react": "^7.26.1",
    "eslint-plugin-react-hooks": "^4.2.0",
    "prettier": "^2.4.1",
    "lint-staged": "^11.2.3",
  }
}
```
*.editorconfig*
```spell
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
*.eslintignore*
```
**/node_modules
build/
```
*.eslintrc.js*
```js
module.exports = {extends: ['airbnb', 'prettier']};
```
*.prettierrc.js*
```js
module.exports = {
  bracketSpacing: false,
  singleQuote: true,
  jsxBracketSameLine: true,
  trailingComma: 'all',
  printWidth: 80,
  parser: 'babel',
}
```