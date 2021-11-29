# create-react-app

## 创建项目 create-react-app projectName [options]

- [commander](https://github.com/tj/commander.js)
  - arguments <project-directory>
  - option
    - template
    - scripts-version
    - use-pnp
    - ...
- fs.ensureDirSync && fs.writeFileSync 写入 package.json
- getInstallPackage && getTemplateInstallPackage 获取 script 和 template 下载信息，并添加 react , react-dom
- 执行下载
- executeNodeScript 执行 react-scripts 的 init
- catch 的情况，移除文件

## react-scripts

- init: 重写 package.json，下载相关依赖
- start
  - checkBrowsers
  - configFactory('development')
  - createCompiler
  - new WebpackDevServer(serverConfig, compiler)
- build
  - configFactory('production')
  - webpack(config)
  - compiler.run
