# 前端 - 从零开始

- 从 **进程** 和 **线程** 说起
  - 进程: 资源分配的基本单位，可以并发的执行
  - 线程: 独立调度的基本单位，一个进程可以有多个线程
  - Chrome: 多进程， 顶级 **Browser Process** 调度其他进程，打开页面新建进程
    - Network Process
    - Storage Process
    - Device Process
    - Plugin Process
    - UI Process
    - **GPU Process**: (transform , opacity , filter , will-change) 3D 加速 、 提升页面渲染 、 图层之间互不影响，减少**重绘回流**
    - **Renderer Process**
      - GUI 渲染线程
        - Parse HTML 、 Recalculate Style 、 Layer 、 Update Layer Tree 、 Paint
        - 与 JavaScript 引擎互斥, 运行在 **Web Worker** 中的代码不会干扰界面(在后台线程中运行)
      - JavaScript 引擎线程(V8)
        - 解析 Javascript 脚本，运行代码
      - 事件触发线程
        - 控制 **Event Loop**，遇到 定时器 、 DomEvent 等，将对应任务加入事件队列队尾，等待 JavaScript 引擎处理
      - 定时器触发线程: **setInterval 与 setTimeout**
      - **异步请求**线程
- 从输入 URL 到页面展示到底发生了什么？
  - 查 IP
    - 本地 hosts 文件
    - DNS 请求 、 解析
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
      - **渲染图层**: 页面普通的**文档流**,绝对定位，相对定位，浮动定位脱离文档流，但仍属于默认图层，共用同一个绘图上下文对象
      - **复合图层**: 独立分配系统资源，每个复合图层都有一个独立的 GraphicsContext。(不管这个复合图层中怎么变化，也不会影响默认复合层里的回流重绘)
      - 查看复合图层: **DevTools** -> More Tools -> Layers
      - 查看硬件加速层: DevTools -> More Tools -> Rendering -> Layer borders
    - 页面加载事件: readystatechange 、 DOMContentLoaded 、 load
    - 页面关闭事件: beforeunload 、 unload
      - 关闭时发送请求: Fetch 的 keepalive 、 SendBeacon （底层是 fetch，常和 img.src 请求一起用作埋点）

## 重绘回流（Repaint/Reflow）

- 重绘: 更改界面外观而不影响布局
  - 界面: color 、outline 、background 、box-shadow 、filter、opacity 、border-radius 、background-size 、visibility
  - 文字: text 、font 、word
- 回流(重排): 布局或几何属性改变，获取布局信息
  - 布局: display 、float 、position
  - 尺寸: margin、padding、border、width、height
  - 获取布局信息: offsetTop 、 scrollTop、 clientTop 、getComputedStyle 、getBoundingClientRect
- 回流必定会发生重绘，重绘不一定会引发回流，与 Event loop 有关
  - 执行完 microtask 后，判断 document 是否需要更新
  - 判断是否有 resize 或者 scroll, 触发事件， 16ms 一次，自带**节流**
  - 判断是否触发 **Media Query**
  - 更新动画以及事件
  - 判断是否有全屏操作事件
  - 执行 **requestAnimationFrame** 回调
  - 执行 **IntersectionObserver** ，**MutationObserver** 回调
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
    - \<video>，\<canvas> 和 \<iframe> 节点
    - will-change （最后的优化手段）

## Web Worker

- Worker
  - postMessage 、 onmessage
- SharedWorker: 多页面使用同一 worker
  - onconnect 、 port.onmessage 、 port.postMessage
- ServiceWorker
  - 作为 web 应用程序 、 浏览器和网络之间的代理服务器
  - XHR 和 **localStorage** 不可使用
  - 出于**安全**，只能由 HTTPS 承载
  - 常用于 **PWA** 离线工作
- 数据
  - 页面与 worker 之间传递数据是通过拷贝(**深拷贝**)，不会共享同一个实例
  - 一般是结构化拷贝:
    - Error 、 Function 、 DOM 的拷贝抛出异常
    - 对象特定参数不保留: **getters 、 setters**
    - **原形链**上的属性不拷贝
- Audio Worker
- Chrome Worker

## Event Loop

- **js 执行环境**会被加入执行**栈**
- 异步任务被挂起到 Task
- Task 分为 microtask 和 macrotask
  - 微任务: **promise** ，Object.observe ，IntersectionObserver 、 MutationObserver
  - 宏任务: script ， setTimeout ，setInterval ，UI rendering
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
  - 高可用: 节点故障会转发到别的节点
  - 伸缩性: 容易添加和删除节点
- 算法
  - 轮询
  - 加权轮询，负载不均衡
  - 最少连接
  - 加权最少连接
  - 随机算法
  - IP HASH: 同一 IP 转发到同一服务器，实现会话粘滞(Sticky Session)
- 转发流程
  - HTTP 重定向: 服务器通过发送特殊的响应， 状态码 3XX，浏览器在接收到后，新的 URL ，并加载
  - DNS 域名解析
  - 反向代理服务器

## HTTP

- HTTP 方法: GET 、 POST 、 PUT 、 DELETE 、 OPTIONS(查询 URL 是否支持) 、 HEAD(不返回主体) 、 CONNECT(加密传输)
- HTTP 状态码:
  - 1xx: Information (信息)
  - 2xx: Success (成功)
    - **200** OK
    - **204** No Content
    - **204** No Content
  - 3xx: Redirect (重定向)
    - **301** 永久性重定向
    - **302** 临时性重定向
    - **303** GET 方法临时性重定向
    - **304** Not Modified，判断 Request Header 字段(If-Match，If-Modified-Since 等)，不满足时返回
  - 4xx: Client Error (客户端错误)
    - **400** Bad Request,语法错误
    - **401** Unauthorized，认证失败
    - **403** Unauthorized, 请求被拒绝
    - **404** Not Found
  - 5xx: Server Error (服务端错误)
    - **500** Internal Server Error
    - **503** Service Unavailable 超负载或无法处理请求
- HEADER
  - Cache-Control: no-store 禁止缓存， no-cache 强制确认缓存， private 私有缓存， public 公有缓存。强缓存: Expires(HTTP 1.0，修改本地时间会失效) 和 Cache-Control(max-age 控制)。协商缓存: Last-Modified 和 If-Modified-Since， 缓存有效会返回 304
  - Date
  - Connection: keep-alive 长连接
  - Accept
  - Accept-Charset
  - Accept-Encoding
  - Accept-Language
  - Authorization
  - Host
  - Referer: 用户访问资源之前的位置
  - Allow
  - Content-Type
  - Content-Length
  - Server
- HTTPS
  - HTTP 和 SSL，证书认证
  - **加密**传输： 非对称加密(公钥和私钥)传输 Secret Key，再对称加密(加密解密同一密钥)通信
- HTTP/2.0
  - 二级制传输，双向数据流
  - 支持服务端推送，相关资源一起发送
  - 首部压缩
  - HTTP/1.1: 长连接、多 TCP 连接、支持**分块传输**

## 文档流和布局

- 文档流: 元素排列时所占得位置，自上而下(块级元素)，自左而右(内联元素)，normal flow(正常布局流)
- 脱离文档流: float 和 定位会使元素脱离文档流
- BFC: 块级格式化上下文，独立的渲染区域
  - 自上而下排布
  - 同一 BFC 两块元素质检的 margin 会重叠
  - BFC 区域不会与浮动元素重叠。
  - float 元素也会参与高度计算
  - 清除浮动即是触发父级 BFC

```css
.clearfix:after {
  content: '';
  visibility: hidden;
  display: block;
  height: 0;
  clear: both;
}
```

- display: none | initial | inherit | inline | block | flex | gird | table | table-cell | table-column | table-row | inline-block | inline-flex | inline-grid | inline-table | list-item
- 定位: static | relative | absolute | fixed | sticky
- Flex 布局
  - 主轴（main axis）
  - 交叉抽（cross axis）
  - flex-direction: row | column | revert | row-reverse | column-reverse 指定主轴方向
  - flex-wrap
  - flex-flow: flex-direction 和 flex-wrap 的缩写
  - flex-shrink: 默认宽度之和大于容器的时候才会发生收缩
  - flex-basis: 元素在主轴方向上的初始大小
  - flex: flex-flow 、 flex-shrink 、 flex-basis 的缩写
  - align-items: 控制交叉轴，
  - 子元素用 align-self 覆盖 align-items 规则, 通过 **order** 改变排序，而不影响 dom 树结构
  - justify-content: 控制主轴
- Grid 布局
  - grid-template-columns|grid-template-rows: 网格的行和列， fr 、 repeat
  - grid-template-areas: 定义网格区域名称
- 多列布局: column-count | column-width | column-gap | column-rule

## [DevTools 调试技巧](https://juejin.cn/post/6844903961472974855)

- Elements - 页面 dom 元素
- Console - 控制台
- Sources - 页面静态资源
- Network - 网络
- Performance - 设备加载性能分析
- Application - 应用信息，PWA/Storage/Cache/Frames
- Security - 安全分析
- Audits - 审计，自动化测试工具

## getComputedStyle 与 getBoundingClientRect

- getComputedStyle: 获取元素计算属性，第二个参数指定**伪元素**，使用 getPropertyValue 获取属性值
- getBoundingClientRect: 返回元素的大小及其相对于视口的位置

## 盒模型 box-sizing

- 标准盒模型: content-box，不包括 padding 和 margin
- IE 盒模型: border-box，包括 padding 和 margin

## 自适应与响应式(Media Query)

- 自适应：不同大小的终端上自适应显示
  - vw 、vh 、 vmin 、 vmax
  - 百分比
  - rem
- 响应式: 不同终端下，显示效果不一样
  - meta viewport
  - @media screen
    - and 、not 、 or
    - min-width 、 min-device-pixel-radio
  - 设备像素比: window.devicePixelRatio 物理像素分辨率与 CSS 像素分辨率之比， DPR = 设备像素 / 独立像素
  - px: 不是一个确定的物理量也不是一个点，是抽象概念，是图像显示的基本单元
  - pt: 绝对单位 1pt = 1/72(inch)
  - dpi: CSS 像素 = 设备独立像素 = 逻辑像素
  - ppi: 像素密度

## 防抖节流

- 防抖: 某个时间段内，函数只在最后一次执行
- 节流: 过滤多次执行，变成每隔一段时间执行
- 实现: 闭包

```js
const debounce = (fn = () => {}, wait = 0, immediate = false) => {
  let timer, context;

  const later = (...args) => {
    timer = setTimeout(() => {
      !immediate && fn.apply(context, args);

      clearTimeout(timer);
      timer = null;
    }, wait);
  };

  return function (...args) {
    context = this;

    if (!timer) immediate && fn.apply(this, args);
    else clearTimeout(timer);

    later(...args);
  };
};
```

```js
const throttle = (
  fn,
  wait,
  { leading, trailing } = {
    leading: true,
    trailing: false,
  }
) => {
  let timer,
    context,
    lastTime = 0;

  const later = (...args) => {
    fn.apply(context, ...args);

    clearTimeout(timer);
    timer = null;
    lastTime = Date.now();
  };

  return function (...args) {
    context = this;
    const time = Date.now();

    if (!timer && trailing) lastTime = time;

    const delay = wait - (time - lastTime);

    if (leading && delay <= 0) later(...args);
    else if (!timer && trailing) {
      timer = setTimeout(() => later(...args), delay);
    }
  };
};
```

## requestAnimationFrame & cancelAnimationFrame

- IE 10
- 重绘之前调用回调函数
- 与屏幕刷新评率有关，电脑越好性能越佳
- 精度高，1ms
- 运行在后台标签页或者隐藏的 \<iframe> 里时，会被暂停调用

## IntersectionObserver 与 MutationObserver

- intersectionObserver: 观察目标元素与其祖先元素或顶级文档视窗交叉状态
- mutationObserver: 监视对 DOM 树所做更改

## requestIdleCallback

- 在事件循环空闲时调用 callback，callback 接收参数 IdleDeadline，用来判断超时前 callback 是否被执行，以及还剩多少闲置时间可以执行耗时任务

```js
const handleCallback = (idleDeadline) => {
  console.log(idleDeadline.didTimeout);

  if (idleDeadline.timeRemaining() < 10)
    return requestIdleCallback(handleCallback);

  console.log('free callback start');

  setTimeout(() => console.log('time in requestIdleCallback'));

  console.log('free callback end');
};

const work = () => {
  console.log('start');

  requestIdleCallback(handleCallback);

  console.log('mid');

  setTimeout(() => console.log('time delay 1ms'));
  setTimeout(() => console.log('time delay 10ms'), 10);
  setTimeout(() => console.log('time after style delay 1s'), 1000);

  requestIdleCallback(() => {
    console.log('free 2');
  });

  console.log('end');
};

work();
```

- **React** 实现了自己的一套 requestIdleCallback，**Schedular** + **Lane**
  - 处理兼容
  - 多平台

## CSS 3D

- transform
- transform-origin
- transform-style: flat | preserve-3d
- perspective: length | none
- perspective-origin
- backface-visibility: visible|hidden

## CSS filter

- filter: none | blur(px) | brightness(%) | contrast(%) | drop-shadow(h-shadow v-shadow blur spread color) | grayscale(%) | hue-rotate(deg) | invert(%) | opacity(%) | saturate(%) | sepia(%) | url()

## CSS3 动画

- @keyframes
- animation: animation-name | animation-duration | animation-timing-function | animation-delay | animation-iteration-count |animation-direction | animation-fill-mode | animation-play-state

## canvas

- 原生
- konva
- echarts | dataV | d3
- 离屏渲染: 创建缓冲区，额外的 canvas

## iframe

- 主域相同子域不同: 设置相同 document.domain ，使用 postMessage 跨域通讯
- 会阻塞页面加载

## web 存储

- storage
  - sessionStorage
  - localStorage
  - storage event
- indexedDB
  - 可存储结构化克隆对象
  - 异步存储，webworker 支持同步 API
  - localForage ，web 存储 Polyfill
- webSQL: deprecated

## web 安全

- 跨站脚本攻击(XSS)
  - 设置 Cookie 为 HttpOnly
  - 过滤特殊字符，转义 js-xss
- 跨站请求伪造(CRSF)
  - Get 请求不对数据进行修改
  - 校验 Referer 字段
  - 校验 Token 、 验证码
- undefined 是不安全的，undefined 可做变量
- 隐形字符 「ㅤ」(十六进制格式为 0x3164),转义为 \u3164

## PWA

## 深拷贝

- JSON.parse(JSON.stringify(obj)): 不能处理函数、正则、 Error 、Date，NaN、Infinity 、undefined 、Symbol 以及 循环引用对象
- Object.assign: 第一层深拷贝
- MessageChannel: 异步 、 不能处理函数等
- \_.cloneDeep
- 深度优先克隆: Object.prototype.call 判断类型 、判断循环引用、递归克隆
- 广度优先克隆

## getter 、 setter 与 Object.defineProperty

- getter: 返回动态计算值的属性
- setter: 改变属性值时被执行
- defineProperty
  - configurable: 是否可删除
  - enumerable: 是否可枚举， for...in 遍历(包括继承的可枚举属性，除了 Symbol)
    - 判断: hasOwnProperty 获取自身属性，propertyIsEnumerable 判断是否可枚举
    - 访问: Object.keys 、 getOwnPropertySymbols 返回自身 Symbol
  - writable: 是否可变
  - value: 属性值，不与 get 、 set 共存

## valueOf 、 toString 与隐式转换

- 原始类型转换: 调用转换函数 Number 、 String 、Boolean
- 引用类型转换
  - 预期转 Number ， 先 valueOf 后 toString
  - 预期转 String，先 toString 后 valueOf
  - 受 \[Symbol.toPrimitive] 影响
  - symbol 不能转 string 或 number，使用 toString() 转字符串
- 单运算与隐式转换
  - 一元运算(+-\*/): 预期转 number
  - 位非(~): 预期转 number
  - 逻辑非(!): 预期转 boolean
  - 递增/递减: 预期转 number
- 表达式中的隐式转换
  - 加号(+)运算
    - 上下文有字符串: 转 string
    - 上下文无字符串: 基本类型预期转 number，非基本类型预期转 string，注意 {} + undefined， {} 在前，作为代码块，与 ({}) + undefined 存在差异
  - 其他运算: 预期转 number
  - == 与 !=
    - 转成相同类型再比较
    - 类型相同的非基本类型，比较内存中的地址
    - ![] == []，!Boolean([]) == []，false == []，0 == 0

## 面向对象与原型

- 特点: 封装、继承、多态
- 对象创建: 字段量、new Object 、工厂函数、构造函数、 class
- 继承(子类能替换所有父类): 构造函数 call(this) 、 原型链继承 、组合继承、 class 的 extends
- 原型链
  - 对象 [[Prototype]] 指向其构造函数的 prototype
  - 构造函数 prototype 的 [[Prototype]] 或 \_\_proto\_\_ 向其构造函数的 prototype
  - 链式向上，直到指向 Object.prototype, Object.prototype 的 \_\_proto\_\_ 为 null
  - constroctor 指向其本身
- 设计模式
  - 单例
  - 工厂
  - 享元
  - 代理
  - 策略
  - 观察者 / 发布订阅
  - 职责链
  - 装饰者
- new 与 instanceof
  - 创建一个新的对象
  - \_\_proto\_\_ 连接原型
  - **apply** 执行构造函数， 绑定 this，
  - 返回对象

```js
const create = (ctor, ...args) => {
  const obj = new Object();

  obj.__proto__ = ctor.prototype;

  const result = ctor.apply(obj, args);

  return typeof result === 'object' ? result : obj;
};
```

- instanceof
  - 沿着原型链，判断对象 \_\_proto\_\_ 是否等于 类型的 prototype

```js
const fakeInstanceof = (instance, Ctor) => {
  let proto = instance.__proto__;

  while (true) {
    if (proto === null) return false;
    if (proto === Ctor.prototype) return true;
    proto = proto.__proto__;
  }
};
```

## 执行上下文与词法作作用域

- 执行上下文
  - 全局上下文
  - 函数上下文
  - eval 上下文
- 词法作用域: 执行上下文创建，存储标识符和实际引用之间的映射，使用 with 改变
  - 全局作用域
  - 模块作用域
  - 函数作用域

```js
var a = { b: 1, c: 2 };
var b = 3;

with (a) {
  var c = 4;
  console.log(b, this.b, c, a);
  // 1,3,4,{ b: 1, c: 4 }
}
```

## eval 实现

```js
function fakeEval(exp) {
  return new Function('return ' + exp).call(this);
}
```

## 栈和堆

- 栈: 自动分配相对固定大小的内存空间, FILO(后进先出)
  - 速度快，容量小
  - 基本数据类型
  - 值传递
- 堆: 动态分配大小不固定不会自动释放的内存空间,无序树状结构，支持 key/value 存储方式
  - 速度慢，容量大
  - 引用数据类型
  - 地址传递，地址指针存储在栈中

## 异步解决方案

- callback
- 事件监听

发布订阅发布订阅实现 event bus

```js
const eventBus = () => {
  subs = new Map();

  return {
    subs,
    $on(type, callback) {
      const sub = subs.get(type);
      const isEmpty = sub && sub.push(callback);
      if (!isEmpty) {
        subs.set(type, [callback]);
      }
    },
    $emit(type, ...payload) {
      (subs.get(type) || []).forEach((fn) => {
        fn(...payload);
      });
    },
    $off(type, callback) {
      const sub = subs.get(type);
      if (sub) {
        sub.splice(sub.indexOf(callback) >>> 0, 1);
      }
    },
  };
};
```

- generator/yield
  - 返回 iterator 对象 Generator
  - next
    - value
    - done
  - return
  - throw
- async/await
  - await Promise
  - await Thenable Objects, { then: (resolve, reject) => {} }
  - for await ... of,抛出异常会中断循环

实现 async, 自执行 generator 包装函数

```js
const generatorRun = (genFunc) => {
  return new Promise((resolve, reject) => {
    const gen = genFunc();

    const run = (next, prevValue) => {
      try {
        const { value, done } = next(prevValue);

        if (done) return resolve(value);
        else return Promise.resolve(value).then(() => run(next, value));
      } catch (e) {
        return reject(e);
      }
    };

    run(gen.next.bind(gen));
  });
};
```

- ## promise
- 三种状态: PENDING 、 FULFILLED 、 REJECTED
- 六个静态方法: resolve 、 reject 、 any 、 race 、 all 、allSettled
- 三个原型方法: then 、 catch 、 finally
- 构造函数: 初始化状态、初始值、 fulfilled queues 、 rejected queues
- 私有方法: #run 、 #resolve 、#reject

```js
const StatusMap = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected',
};

class Promise {
  static resolve(value) {
    return new Promise((resolve) => resolve(value));
  }

  static reject(value) {
    return new Promise((resolve, reject) => reject(value));
  }

  static race(iterable) {
    return new Promise((resolve, reject) => {
      iterable.forEach((promise) => {
        Promise.resolve(promise).then(resolve, reject);
      });
    });
  }

  static any(iterable) {
    return new Promise((resolve, reject) => {
      let results = [];
      iterable.forEach((promise) => {
        Promise.resolve(promise).then(resolve, (err) => {
          results.push(err);
          if (results.length === iterable.length) reject(results);
        });
      });
    });
  }

  static all(iterable) {
    return new Promise((resolve, reject) => {
      let results = [];
      Object.entries(iterable).forEach(([i, promise]) => {
        Promise.resolve(promise).then((value) => {
          results[i] = value;
          if (results.length === iterable.length) resolve(results);
        }, reject);
      });
    });
  }

  static allSettled(iterable) {
    return new Promise((resolve, reject) => {
      let results = [];
      Object.entries(iterable).forEach(([i, promise]) => {
        Promise.resolve(promise)
          .then(
            (value) => {
              results[i] = { value, status: StatusMap.FULFILLED };
            },
            (err) => {
              results[i] = { value: err, status: StatusMap.REJECTED };
            }
          )
          .finally(
            () => results.length === iterable.length && resolve(results)
          );
      });
    });
  }

  constructor(handler) {
    Object.assign(this, {
      status: StatusMap.PENDING,
      value: undefined,
      fulfilledQueue: [],
      rejectedQueue: [],
    });

    handler(this.#resolve.bind(this), this.#reject.bind(this));
  }

  #run(status, value, queue) {
    Object.assign(this, {
      status,
      value,
    });

    let callback;
    while ((callback = queue.shift())) {
      callback(value);
    }
  }

  #resolve(value) {
    if (this.status === StatusMap.PENDING) return;
    if (value instanceof Promise)
      return value.then(this.#resolve.bind(this), this.#reject.bind(this));

    setTimeout(() =>
      this.#run(StatusMap.FULFILLED, value, this.fulfilledQueue)
    );
  }

  #reject(err) {
    if (this.status === StatusMap.PENDING) return;

    setTimeout(() =>
      this.#run(StatusMap.REJECTED, err, this.rejectedQueue)
    );
  }

  then(onFulfilled, onRejected) {

  }

  catch(onRejected) {}

  finally(callback) {}
}
```

## 状态机

- 有限状态机
- 无线状态机

```js
function* idMaker() {
  let index = 0;
  while (true) yield index++;
}
```

## 加密方式

## 文件上传与下载

- 上传
  - input file & formData: file | blob | base64
    - 分片上传: slice 分片
    - 断点上传: ${hash}-${i} 设置分片名，跳过已上传
  - onDrop 、 onDragOver: e.dataTransfer?.files
- 下载
  - URL.createObjectURL(可能会跨域) + a 标签

## css 选择器 、伪类与伪元素

## 跨域

## 页面通信

## 递归

## call & apply & bind

## 闭包

## 浏览器垃圾回收机制
