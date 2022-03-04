# ES6

ES6 泛指 ECMAScript 2015 及以后的版本

### ES2015

- 箭头函数

  - 支持表达式和陈述式
  - 与周围代码共享 this
  - 无 arguments

- Class

  - 基于 prototype 的 extends
  - constructor, super, static
  - 声明会提升，但不会初始化赋值
  - 方法不可枚举
  - 方法没有 prototype，也没有[[construct]] 不能使用 new 调用

- 对象属性增强

  - 支持 **proto** 设置
  - 简写
  - super 调用
  - 动态属性名

- 模板字符串
- 解构赋值
- 函数参数默认值, rest 与 spread 参数
- let & const

  - 块级声明
    - 暂时性死区，不会变量提升
    - 作用域内有效
    - 不可重复声明
  - 循环中的块级作用域： 每次循环都会重新创建变量

- Iterators + For..Of
  - [Symbol.iterator](){}
- Generators
- Modules
  - import
  - export
- Map + Set + WeakMap + WeakSet
- Proxy
- Symbols
- API 扩展

  - Number.EPSILON
  - Number.isInteger(Infinity) // false
  - Number.isNaN("NaN") // false
  - "abcde".includes("cd") // true
  - "abc".repeat(3) // "abcabcabc"
  - Array.from(document.querySelectorAll("\*")) // Returns a real Array
  - Array.of(1, 2, 3) // [1,2,3]
  - [0, 0, 0].fill(7, 1) // [0,7,7]
  - [1,2,3].findIndex(x => x == 2) // 1
  - ["a", "b", "c"].entries() // iterator [0, "a"], [1,"b"], [2,"c"]
  - ["a", "b", "c"].keys() // iterator 0, 1, 2
  - ["a", "b", "c"].values() // iterator "a", "b", "c"
  - Object.assign(Point, { origin: new Point(0,0) })

- Promise
- Reflect API

- 函数尾调用优化

### ES7

- \*\* 取幂

### ES8

- async/await

### ES9

- generator async
- dotAll: /./s
- 命名捕获: (?<name>x)
- 正则: Unicode 模式
- 对象的 rest \ spread

### ES10

- optional-catch-binding: try {} catch {}

### ES11

- export 命名导出: export \* as name from ''
- 空值合并操作符: ??
- 可选链: ?.
- dynamic import: import()
- Number.MAX_SAFE_INTEGER

### ES12

- 逻辑判断赋值: a ||= b, a &&= b

### ES13

- class properties
- class static block: 静态私有属性 static #x = 42;
- 对象私有属性:{ #bar = "bar"}
- top level await: babel 不支持，用 rollUp 或 webpack 5
  ```js
  const val = await promise;
  export { val };
  ```

### 参考

- [Babel-Learn ES2015](https://babeljs.io/docs/en/learn/)
- [Babel-Plugin list](https://babeljs.io/docs/en/plugins-list)
