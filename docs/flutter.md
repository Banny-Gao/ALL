# 环境搭建
- Flutter SDK
  - [单一版本安装，官方地址](https://flutter.dev/docs/get-started/install)
  - 多版本安装。[Dart SDK](https://dart.dev/get-dart) 、 [fvm](https://fvm.app/docs/getting_started/installation)
- [Android Studio](https://developer.android.com/studio)
  - SDK 与模拟器

JDK安装
vscode 插件

相关环境变量配置
# flutter
export PATH=$PATH:/usr/lib/dart/bin
export PATH=$PATH:$HOME/.pub-cache/bin
export PATH=$PATH:$HOME/fvm/default/bin
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn

# java
export JAVA_HOME=/usr/lib/jvm/jdk1.8.0_281
export JRE_HOME=${JAVA_HOME}/jre  
export CLASSPATH=.:${JAVA_HOME}/lib:${JRE_HOME}/lib  
export PATH=${JAVA_HOME}/bin:$PATH

# android
export ANDROID_HOME=$HOME/android-studio/
export ANDROID_SDK=$HOME/android-sdk
export PATH=$ANDROID_HOME/bin:$ANDROID_SDK/platform-tools:$ANDROID_SDK/tools:$ANDROID_SDK/build-tools/24.0.0:$PATH

运行 flutter doctor 没问题，我们就可以创建项目了.

# 下载1.20.0 flutter-sdk
fvm install 1.20.0
# 全局启用
fvm global 1.20.0
# 版本
flutter --verison
flutter doctor

# https://flutter.dev/docs/development/packages-and-plugins/developing-packages
# 创建packge和example
flutter create --template=package toast
cd toast && flutter create example
# 打开工程目录
code .

开发与调试
文件与目录
.metadata  ​- 项目配置信息，版本对照
pubspec.yaml ​- 依赖配置
toast.imi - ​工程文件路径配置
lib 里才是我们开发组件库的代码，我们需要引入组件库，以便开发时实时预览。
example/pubspec.yaml

example/lib 是我们预览程序代码，main.dart 则是入口。示例代码很简单而且有详细的注释，这里就不多作介绍了。dart 语法有问题可以参见文末 dart 语法链接。
需要说的是，示例代码里有几个比较重要的API
flutter/widgets
 runApp 入口函数
StatelessWidget 无状态组件
StatefulWidget  有状态组件
State 有状态组件的逻辑和内部状态
setState 
flutter/material
​MaterialApp 基于 material 风格应用程序级别组件，路由、主题、语言之类的配置
Scaffold 框架布局组件
其他小组件
基于这些函数和组件，一个简单的 Flutter 应用就能呈现出来。
运行和调试
直接从 vscode 启动项目 example

调试工具与浏览器控制台大同小异 -使用文档
从组件代码到界面，有几点问题值得思考
组件是怎么渲染到页面上去的？
无状态组件和有状态组件区别？
调用 setState 后 UI 是怎么更新的？
widgets 和 material​ 库有什么关联，还有其他库可以用么，什么时候该怎么使用
这些，都与 Flutter 的设计原理和渲染机制有关系，我们来简单了解一下。
Flutter渲染机制
设计原则

Flutter架构分为三层
Embedder(嵌入器)
托管Flutter内容的原生程序，为打包提供入口
为 Flutter 引擎创建和管理线程（及其消息循环），提供 Flutter 引擎任务运行器
平台任务运行器
用户界面任务运行器
GPU 任务运行器
IO 任务运行器
Flutter Engine
基于 Skia (图形渲染)和 Dart（VM）
绘制帧时，对合成场景光栅化
提供 Flutter 核心 API 的底层实现，包括图形、文本、文件、网络 I/O、访问支持、插件架构和 Dart 运行编译等
通过 dart-ui暴露底层服务给 Flutter Framework 层，如驱动输入、图形文本和渲染子系统的类
Flutter Framework
foundation提供基础类和构建服务，例如animation、painting和gestures
rendering 提供了处理布局的抽象，构建可渲染对象树。
widgets Flutter Widgets 框架，使用 RenderObject 层次结构来实现其布局和绘制后端
Material、Cupertino 基于Flutter Widgets实现Material和IOS风格组件
渲染机制
简单的来说的，即 Framework 层构建下面三棵树，然后调用Engine提供的服务渲染到界面上。

具体是怎么样转换然后是怎么渲染的呢，回到最初，我们来看看 runApp 到底做了些什么。

顺着源代码去看，Material 基于 widgets 实现，各个 Binding 由 fundation 提供能力，在 engine 的作用下，调用底层 dart:ui 实现最终绘制。
而期间涉及到各个 Binding 的 初始化，widget 的在 buildScope中的转换，新旧 node 的判断，setSate 也是在各个判断调用 element.markNeedsBuild， 在各个判断后回到与出初始渲染一致的 ensureVisualUpdate，由 window.scheduleFrame 重新唤起 handleBeginFrame 执行 ，执行 WidgetsFlutterBinding 初始化时绑定的 SchedulerBinding 的屏幕刷新回调，调用 dart:ui 的原生绘制能力。