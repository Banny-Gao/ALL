# Compose

- 执行一系列任务
- 上个任务执行结果是下个任务参数
- 任务是同步的

## 实现

```js
const compose = (...fns) =>
  fns.reduceRight(
    (preFn, nextFn) =>
      (...args) =>
        nextFn(preFn(...args)),
    (value) => value
  );
```
