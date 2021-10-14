# cra 实现

## 从搭建 monorepo 开始

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

添加一些常用全局依赖

```shell
yarn add @commitlint/config-conventional @commitlint/cli husky prettier webpack plop -W -D
```
