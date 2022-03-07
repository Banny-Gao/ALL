# 渲染机制

- 从 **进程** 和 **线程** 说起
  - 进程：资源分配的基本单位，可以并发的执行
  - 线程：独立调度的基本单位，一个进程可以有多个线程
  - Chrome： 多进程， 顶级 **Browser process** 调度其他进程，打开页面新建进程
    - Network Process
    - Storage Process
    - Device Process
    - Plugin Process
    - UI Process
    - **GPU Process**: (transform,opacity,filter,will-change) 3D 加速、提升页面渲染、图层之间互不影响，减少重绘回流
    - **Renderer Process**
      - GUI 渲染线程
        - Parse HTML、Recalculate Style、Layer、Update Layer Tree、Paint
        - 与 JavaScript 引擎互斥
      - JavaScript 引擎线程
        - 解析 Javascript 脚本，运行代码
      - 事件触发线程
        - 控制事件循环，遇到 setTimeOut、Event 等，将对应事件添加事件队列队尾，等待 JavaScript 引擎处理
        - Event Loop
      - 定时器触发线程： setInterval 与 setTimeout
      - 异步请求线程
- 从输入 URL 到页面展示到底发生了什么？
  - 查 IP
  - 浏览器发 HTTP 请求
  - 服务器处理请求
  - 服务器返回 HTTP 响应
  - 渲染页面
    - 解析 HTML, 构建 DOM Tree
    - 解析 CSS, 构建 [CSS Object Model](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model)
    - 结合 DOM Tree 生成 RenderObject Tree
    - 布局 RenderObject 树 （Layout/reflow）,计算视窗内确切位置和大小
    - 绘制 RenderObject 树 （Paint）
    - GPU 处理默认图层和复合图层，合成 （Composite）后展示页面
    - 页面加载事件：beforeunload、readystatechange 、DOMContentLoaded 、load

## 重绘回流（Repaint/Reflow）

- 重绘:更改外观而不影响布局, color
- 回流:布局或几何属性改变
  - window 大小
  - 字体
  - 定位或浮动
  - 盒模型
- 回流必定会发生重绘，重绘不一定会引发回流，与  Event loop 有关
  - 执行完 microtask 后，判断 document 是否需要更新
  - 判断是否有 resize 或者 scroll, 出发事件
  - 判断是否触发 media query
  - 更新动画以及事件
  - 判断是否有全屏操作事件
  - 执行 requestAnimationFrame 回调
  - 执行 IntersectionObserver 回调
  - 以上是一帧，有空闲时间，执行 requestIdleCallback 回调

## Event Loop

- JS 执行环境会被加入执行栈
- 异步任务被挂起到 Task
- 执行栈为空，Event Loop 从 Task 队列中取任务入执行栈
- Task 分为 microtask 和 macrotask
  - 微任务：promise ，Object.observe ，MutationObserver
  - 宏任务：script ， setTimeout ，setInterval ，UI rendering

## 盒模型