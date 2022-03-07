# 页面渲染流程

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
        - 与 JavaScript 引擎互斥
      - JavaScript 引擎线程
        - 解析 Javascript 脚本，运行代码
      - 事件触发线程
        - 控制  **Event Loop**，遇到 定时器、DomEvent 等，将对应任务加入事件队列队尾，等待 JavaScript 引擎处理
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
    - **布局** RenderObject 树,计算视窗内确切位置和大小
    - 绘制 RenderObject 树 （Paint）
    - GPU 处理默认图层和复合图层，合成 （Composite）后展示页面
    - 页面加载事件：beforeunload、readystatechange 、DOMContentLoaded 、load
    - 页面关闭事件：beforeunload、unload
      - 关闭时发送请求： **fetch** 的 keepalive 、SendBeacon （底层是fetch，常用于**埋点**）


## 重绘回流（Repaint/Reflow）

- 重绘：更改外观而不影响布局, color
- 回流：布局或几何属性改变
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
  - 以上是*一帧*，有空闲时间，执行 requestIdleCallback 回调
- 优化
  - transform 替代定位
  - visibility 替代 display:none
  - 减少 DOM 操作
  - 避免 table 布局
  - requestAnimationFrame
  - 将动画节点变为图层
    - CSS 3D
    - CSS3 动画
    - canvas 节点
    - will-change

## Event Loop

- JS 执行环境会被加入执行栈
- 异步任务被挂起到 Task
- 执行栈为空，Event Loop 从 Task 队列中取任务入执行栈
- Task 分为 microtask 和 macrotask
  - 微任务：promise ，Object.observe ，MutationObserver
  - 宏任务：script ， setTimeout ，setInterval ，UI rendering

##  SetInterval 与 SetTimeout

## 异步请求


## 负载均衡
- 服务器无状态，负载均衡器根据节点负载情况，将请求合理转发到各个节点
  - 高可用： 节点故障会转发到别的节点
  - 伸缩性： 容易添加和删除节点
- 算法
  - 轮询
  - 加权轮询，负载不均衡
  - 最少连接
  - 加权最少连接
  - 随机算法
  - IP HASH：同一IP转发到同一服务器，实现会话粘滞(Sticky Session)
- 转发流程
  - HTTP 重定向：服务器通过发送特殊的响应， 状态码 3XX，浏览器在接收到后，新的 URL ，并加载
  - DNS 域名解析
  - 反向代理服务器

## HTTP

## 布局与文档流

## 埋点

## 盒模型