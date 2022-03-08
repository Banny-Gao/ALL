# 前端 - 从零开始

- 从 **进程** 和 **线程** 说起
  - 进程：资源分配的基本单位，可以并发的执行
  - 线程：独立调度的基本单位，一个进程可以有多个线程
  - Chrome： 多进程， 顶级 **Browser Process** 调度其他进程，打开页面新建进程
    - Network Process
    - Storage Process
    - Device Process
    - Plugin Process
    - UI Process
    - **GPU Process**: (transform , opacity , filter , will-change) 3D 加速、提升页面渲染、图层之间互不影响，减少**重绘回流**
    - **Renderer Process**
      - GUI 渲染线程
        - Parse HTML、Recalculate Style、Layer、Update Layer Tree、Paint
        - 与 JavaScript 引擎互斥, 运行在 **Web Worker** 中的代码不会干扰界面(在后台线程中运行)
      - JavaScript 引擎线程(V8)
        - 解析 Javascript 脚本，运行代码
      - 事件触发线程
        - 控制 **Event Loop**，遇到 定时器、DomEvent 等，将对应任务加入事件队列队尾，等待 JavaScript 引擎处理
      - 定时器触发线程： **setInterval 与 setTimeout**
      - **异步请求**线程
- 从输入 URL 到页面展示到底发生了什么？
  - 查 IP
    - 本地 hosts 文件
    - DNS 请求、解析
      - Domain Name System，域名系统
      - 递归解析
      - 迭代解析
      - DNS **负载均衡**
  - 浏览器发 **HTTP** 请求
  - 服务器处理请求
  - 服务器返回 HTTP 响应
  - 渲染页面
    - 解析 HTML, 构建 DOM Tree
    - 解析 CSS, 构建 [CSS Object Model](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model)
    - 结合 DOM Tree 生成 RenderObject Tree
    - 布局 RenderObject 树,计算视窗内确切位置和大小
    - 绘制 RenderObject 树 （Paint）
    - GPU 处理渲染图层和复合图层，合成 （Composite）后展示页面
      - **渲染图层**：页面普通的**文档流**,绝对定位，相对定位，浮动定位脱离文档流，但仍属于默认图层，共用同一个绘图上下文对象
      - **复合图层**：独立分配系统资源，每个复合图层都有一个独立的 GraphicsContext。(不管这个复合图层中怎么变化，也不会影响默认复合层里的回流重绘)
      - 查看复合图层：**DevTools** -> More Tools -> Layers
      - 查看硬件加速层：DevTools -> More Tools -> Rendering -> Layer borders
    - 页面加载事件：readystatechange 、DOMContentLoaded 、load
    - 页面关闭事件：beforeunload、unload
      - 关闭时发送请求： Fetch 的 keepalive 、SendBeacon （底层是 fetch，常用于**埋点**）

## 重绘回流（Repaint/Reflow）

- 重绘：更改外观而不影响布局, color
- 回流：布局或几何属性改变
  - window 大小
  - 字体
  - 定位或浮动
  - **盒模型**
- 回流必定会发生重绘，重绘不一定会引发回流，与 Event loop 有关
  - 执行完 microtask 后，判断 document 是否需要更新
  - 判断是否有 resize 或者 scroll, 出发事件
  - 判断是否触发 **media query**
  - 更新动画以及事件
  - 判断是否有全屏操作事件
  - 执行 **requestAnimationFrame** 回调
  - 执行 **IntersectionObserver** 回调
  - 以上是*一帧*，有空闲时间，执行 **requestIdleCallback** 回调
- 优化
  - transform 替代定位
  - visibility 替代 display:none
  - 减少 DOM 操作
  - 避免 table 布局
  - requestAnimationFrame
  - 将动画节点变为图层
    - **CSS 3D**, 加 z-index， 人为干扰复合层的排序
    - **CSS filter**
    - **CSS3 动画**
    - <video>，<canvas> 和 <iframe> 节点
    - will-change （最后的优化手段）

## Web Worker

- Worker
  - postMessage 、 onmessage
- SharedWorker：多页面使用同一 worker
  - onconnect 、 port.onmessage 、 port.postMessage
- ServiceWorker
  - 作为 web 应用程序、浏览器和网络之间的代理服务器
  - XHR 和 **localStorage** 不可使用
  - 出于**安全**，只能由 HTTPS 承载
  - 常用于 **PWA** 离线工作
- 数据
  - 页面与 worker 之间传递数据是通过拷贝(**深拷贝**)，不会共享同一个实例
  - 一般是结构化拷贝：
    - Error 、Function 、DOM 的拷贝抛出异常
    - 对象特定参数不保留：**getters 、setters**
    - **原形链**上的属性不拷贝
- Audio Worker
- Chrome Worker

## Event Loop

- JS 执行环境会被加入执行栈
- 异步任务被挂起到 Task
- Task 分为 microtask 和 macrotask
  - 微任务：**promise** ，Object.observe ，IntersectionObserver 、MutationObserver
  - 宏任务：script ， setTimeout ，setInterval ，UI rendering
- 执行栈为空，Event Loop 从 Task 队列中取任务入执行栈
  - 执行同步代码，宏任务
  - 执行为空，查询是否有微任务需要执行
  - 执行微任务
  - 必要的话渲染 UI
  - 开始下一轮 Event Loop

## SetInterval 与 SetTimeout

- setTimeout 只会往队列中添加一次
- setInterval 每隔一段时间把回调函数放进任务队列中，而不考虑函数的执行
- 由于 setInterval 的性能问题，常用 setTimeout 模拟 setInterval
- 更优方案，requestAnimationFrame 实现定时器

```js
class Timer {
  static base(handler, timeout, args, loop) {
    let timeStamp = Date.now();

    const timer = {
      value: -1,
      valueOf: function () {
        return this.value;
      },
    };

    const callback = () => {
      if (Date.now() - timeStamp >= timeout) {
        handler.apply(callback, args);

        if (loop) {
          timeStamp = Date.now();
          timer.value = requestAnimationFrame(callback);
        }
      } else timer.value = requestAnimationFrame(callback);
    };

    timer.value = requestAnimationFrame(callback);

    return timer;
  }

  static setTimeout = (handler, timeout, ...args) =>
    Timer.base(handler, timeout, args);

  static setInterval = (handler, timeout, ...args) =>
    Timer.base(handler, timeout, args, true);

  static clear = (timer) => cancelAnimationFrame(timer);
}
```

## 异步请求

- XMLHttpRequest / ActiveXObject (IE6)
- Fetch
  - Request
  - Response
    - ReadableStream
- Websocket

## 负载均衡

- 服务器无状态，负载均衡器根据节点负载情况，将请求合理转发到各个节点
  - 高可用：节点故障会转发到别的节点
  - 伸缩性：容易添加和删除节点
- 算法
  - 轮询
  - 加权轮询，负载不均衡
  - 最少连接
  - 加权最少连接
  - 随机算法
  - IP HASH：同一 IP 转发到同一服务器，实现会话粘滞(Sticky Session)
- 转发流程
  - HTTP 重定向：服务器通过发送特殊的响应， 状态码 3XX，浏览器在接收到后，新的 URL ，并加载
  - DNS 域名解析
  - 反向代理服务器

## HTTP
- HTTP方法： GET 、POST 、 PUT 、DELETE 、 OPTIONS(查询 URL 是否支持) 、HEAD(不返回主体) 、 CONNECT(加密传输)
- HTTP状态码: 
  - 1xx: Information (信息)
  - 2xx: Success (成功)
    - **200** OK
    - **204** No Content 
    - **204** No Content 
  - 3xx: Redirect (重定向)
    - **301** 永久性重定向
    - **302** 临时性重定向
    - **303**  GET 方法临时性重定向
    - **304** Not Modified，判断Request Header字段(If-Match，If-Modified-Since等)，不满足时返回
  - 4xx: Client Error (客户端错误)
    - **400** Bad Request,语法错误
    - **401** Unauthorized，认证失败
    - **403** Unauthorized, 请求被拒绝
    - **404** Not Found
  - 5xx: Server Error (服务端错误)
    - **500** Internal Server Error
    - **503** Service Unavailable 超负载或无法处理请求

## 布局和文档流
- display
  - block


## DevTools

## 埋点

## 盒模型

## Media Query

## requestAnimationFrame

## IntersectionObserver 与 MutationObserver

## requestIdleCallback

## CSS 3D

## CSS filter

## CSS3 动画

## canvas

## iframe

## web 存储

## web 安全

## PWA

## 深拷贝与浅拷贝

## getter 与 Object.defineProperty

## 面向对象与原型链

## Promise
