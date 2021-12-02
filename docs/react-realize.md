# React 源码阅读

## 从 build 开始

## react

### ReactSymbols

- 使用 [Symbol.for](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Symbol/for) 定义了一些 react 类型
- 暴露了 getIteratorFn, 获取 iterator 的方法

### Children

- 包含 forEach, map(children, **callback**, **context**), count, toArray, only 的对象
- 核心是 mapIntoArray (递归)，
  - mappedChild = **callback**.call(**context**, child)
  - 非 REACT_ELEMENT_TYPE 类型不作处理
  - REACT_ELEMENT_TYPE 类型， 进行 cloneAndReplaceKey 转换生成新的 key，新的 key 标识出元素在树节点中的位置信息以及原来的 key 值
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
