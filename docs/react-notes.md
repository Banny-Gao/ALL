- Why JSX?
  - JSX 是 JavaScript 的语法扩展,用于生成 React 元素
  - 使用 JSX 使代码结构分明，错误和警告信息易于分析
  - React DOM 在呈现 JSX 中的值之前会转义, 有助于防止 XSS 攻击
  - Babel 编译 JSX 为 **React.createElement(type, props, ...children)**, type 为 HTMLInputElement(type = 'input')、 HTMLElement、 SVGElement 以及 DOMElement

```typescript
const Example = () => {
  return (
    <>
      <h1
        onClick={() => {
          alert('jsx');
        }}
      >
        JSX H1
      </h1>
      {createElement(
        'h1',
        {
          onClick: () => {
            alert('createElement');
          },
        },
        'CreateElement h1'
      )}
    </>
  );
};
```

- Code-Splitting

  - webpack 配置
    - 多个 entry， output 配置 filename: '[name].bundle.js'
    - entry 配置共享模块 **dependOn**， SPA 需要配置 optimization.runtimeChunk: 'single'
    - SplitChunksPlugin
    - Dynamic Imports
    - Named Exports
  - **React.lazy**

- React.lazy 与 Suspense
  - 异步加载 Component
  - Suspense 可配合路由使用, _fallback_ 作预览展示或其他

```typescriptreact
import React, {
  FC,
  lazy,
  Suspense,
  ComponentType,
  useState,
  useEffect,
  LazyExoticComponent,
} from 'react';

interface IShowTitleProps {
  title: string;
}

type ShowTitleComponentType = ComponentType<IShowTitleProps>;

const ShowTitle: FC<IShowTitleProps> = ({ title }) => (
  <span>{title}</span>
);

const factory = () =>
  new Promise<{ default: ShowTitleComponentType }>((resolve) => {
    setTimeout(
      () =>
        resolve({
          default: ShowTitle,
        }),
      2000
    );
  });

const SimpleTitle = lazy(factory);

export const LazyComponent: FC<{
  showLoading?: boolean;
  title: string;
}> = ({ showLoading = false, title }) => {
  const [DynamicComponent, setDynamicComponent] =
    useState<LazyExoticComponent<ShowTitleComponentType>>();

  useEffect(() => {
    setDynamicComponent(lazy(factory));
  }, [title]);

  return (
    <>
      <Suspense fallback={showLoading && 'loading...'}>
        {DynamicComponent && <DynamicComponent title={title} />}
      </Suspense>

      <br />

      <Suspense fallback={<p>loading once</p>}>
        <SimpleTitle title={title} />
      </Suspense>
    </>
  );
};
```
