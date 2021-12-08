# React 源码阅读

## 从 build 开始

## react

### ReactSymbols

- 使用 [Symbol.for](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for) 定义了一些 react 类型
- 暴露了 getIteratorFn, 获取 iterator 的方法
- Fragment, Profiler, StrictMode, Suspense 以及 SuspenseList 只是 Symbol 类型标记, 非 REACT_ELEMENT_TYPE 类型，不会映射到 DOM

### Children

- 包含 forEach, map(children, **callback**, **context**), count, toArray, only 的对象
- 核心是 mapIntoArray (递归)，
  - mappedChild = **callback**.call(**context**, child)
  - 非 REACT_ELEMENT_TYPE 类型不作处理, isValidElement 判断
  - REACT_ELEMENT_TYPE 类型， 由 cloneAndReplaceKey 接收 newKey 调用 ReactElement 返回新元素，，新的 key 标识出元素在树节点中的位置信息以及原来的 key 值
  - 将 children 树转成一维数组

```js
const iterable = {
  [Symbol.iterator]: function* () {
    yield 2;
    yield 3;
    yield 4;
  },
};

const mappedChildren = Children.map(
  [
    'a',
    1,
    iterable,
    { $$typeof: Symbol.for('react.element') },
    { $$typeof: Symbol.for('react.element'), key: 6 },
    [7, [8, { $$typeof: Symbol.for('react.element'), key: 9 }, 10]],
  ],
  (child: any) => child
);
console.log(mappedChildren);
[
  'a',
  1,
  2,
  3,
  4,
  {
    $$typeof: Symbol(react.element),
    key: '.3',
  },
  {
    $$typeof: Symbol(react.element),
    key: '.$6',
  },
  7,
  8,
  {
    $$typeof: Symbol(react.element),
    key: '.5:1:$9',
  },
  10,
];
```

### ReactElement

- createElement: 初始化 ref, key, props, children， ReactElement 创建元素
- createFactory: _createElement.bind(null, type);_
- cloneElement: 与 createElement 不同的是, createElement 默认 owner 是 ReactCurrentOwner.current, 而 cloneElement 保留原，在传了 config.ref 的情况下才更新为 ReactCurrentOwner.current

### Component

- 绑定 props, context, refs 和 updater
- setState 执行 updater.enqueueSetState, 传入 this, partialState, callback
- 标记 isReactComponent
- PureComponent 标记 isPureComponent

### createRef & forwardRef & createContext

- createRef 即返回 Object.seal 处理过的 { current: null, };
- forwardRef: (render: (props, ref) => ReactElement) => { $$typeof: REACT_FORWARD_REF_TYPE, render}
- createContext: (defaultValue) => context: { $$typeof: REACT_CONTEXT_TYPE, Provider: { $$typeof: REACT_PROVIDER_TYPE, \_context: context }, Consumer: context }

### lazy

- 接收 factory: () => Promise<{ default: T }>
- 返回 lazyType: { $$typeof: REACT_LAZY_TYPE, \_payload: payload: { \_status: Uninitialized, \_result: factory}, \_init: lazyInitializer }

### memo

- memo: (type: Component, compare: (prevProps, nextProps) => boolean) => elementType: { $$typeof: REACT_MEMO_TYPE, type, compare: compare === undefined ? null : compare };

### React Hooks

- 调用 ReactCurrentDispatcher.current[hook]
