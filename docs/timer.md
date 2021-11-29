# 定时器

- [setTimeout](https://developer.mozilla.org/zh-CN/docs/Web/API/setTimeout)
- [setInterval](https://developer.mozilla.org/zh-CN/docs/Web/API/setInterval)
- [requestAnimationFrame](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/requestAnimationFrame)

## 实现

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
