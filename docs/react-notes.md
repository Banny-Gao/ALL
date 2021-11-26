- Why JSX?

  - JSX 是 JavaScript 的语法扩展,用于生成 React 元素
  - 使用 JSX 使代码结构分明，错误和警告信息易于分析
  - React DOM 在呈现 JSX 中的值之前会转义, 有助于防止 XSS 攻击
  - Babel 编译 JSX 为 **React.createElement(type, props, ...children)**, type 为 HTMLInputElement(type = 'input')、 HTMLElement、 SVGElement 以及 DOMElement
  - [example](../packages/react-ts-app/src/JsxAndCreateElement.tsx)

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
  - [example](../packages/react-ts-app/src/LazyComponent.tsx)

- Context

  - React.createContext
  - Context.Provider
  - Context.Consumer
  - Context.displayName 给 react-dev-tools 使用
  - - [example](../packages/react-ts-app/src/ContextExample.tsx)

- Error Boundaries

  - static getDerivedStateFromError()
    - render 阶段调用，不允许出现副作用。返回新的 state，以便下次 render 时回退 UI
  - componentDidCatch()
    - 接收 error 和 info， 在 commit 阶段执行，允许副作用，用作错误收集报告
  - 只有 class component 能作 Error Boundary，且只能捕获其子组件错误，无法捕获自身错误

- Forwarding Refs

  - forwardRef [example](../packages/react-ts-app/src/ForwardRefExample.tsx)
  - createRef 最好用在 class component
  - useRef 用在 FC, 返回 mutable ref, 接收 initialValue 初始化 current。 不只是 Dom Refs,可作实例变量，current 的变化不会 re-render
  - callback ref, 配合 useCallback 测量 Dom 属性 [example](../packages/react-ts-app/src/MeasureExample.tsx)

- HOC

  - 高阶组件既是接收一个组件并返回一个新的组件
  - 不要在 render 里使用 HOC
    - 每次都是返回的新的组件，造成性能消耗
    - 自身状态和子节点丢失
  - 静态方法丢失，可以使用 [hoist-non-react-statics](https://github.com/mridgway/hoist-non-react-statics), 或者引入组件自身的静态方法
  - 组件接收的 ref 不能直传递，需要 forwardRef 处理

- Optimize Performance

  - 工程化
  - 虚拟化列表 react-window 和 react-virtualized
  - shouldComponentUpdate 和 PureComponent
  - 不可变数据 immer 和 immutable.js

- crateReactClass

  - 接收 ComponentSpec<IProps, IState> 类型参数，返回 ClassicComponentClass<IProps> 构造函数
  - 无 this 指向问题
  - [example](../packages/react-ts-app/src/CreateReactClassExample.tsx)

- API

  - Component
  - PureComponent: shouldComponentUpdate 浅比较
  - memo: FC 的 PureComponent，第二个参数 areEqual 支持控制比较，
  - createElement
  - cloneElement
  - createFactory
  - isValidElement
  - Fragment
  - createRef
  - forwardRef
  - lazy
  - Suspense

- lifecycle

  - Mounting
    - constructor
    - static getDerivedStateFromProps
    - render
    - componentDidMount
  - Updating
    - static getDerivedStateFromProps
    - shouldComponentDidUpdate
    - render
    - getSnapshotBeforeUpdate
    - componentDidUpdate
  - Unmounting
    - componentWillUnmount
  - Error Handling
    - static getDerivedStateFromError
    - componentDidCatch

- react-dom

  - render
  - hydrate: 服务端渲染
  - unmountComponentAtNode
  - findDOMNode: StrictMode 已弃用
  - createPortal

- DOM Elements

  - checked & defaultChecked(非受控默认值)
  - value & defaultValue
  - className
  - dangerouslySetInnerHTML
  - htmlFor
  - onChange
  - selected
  - style
  - contentEditable & suppressContentEditableWarning

- Hooks
  - useState
  - useEffect
  - useContext
  - [example](../packages/react-ts-app/src/HooksExample.tsx)
