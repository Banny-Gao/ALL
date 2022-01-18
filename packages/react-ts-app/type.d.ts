declare module '*.svg' {
  const content: any;
  export default content;
  export const ReactComponent = content;
}

declare module 'react-realize/lib/react' {
  interface ExoticComponent<P = {}> {
    /**
     * **NOTE**: Exotic components are not callable.
     */
    (props: P): (any);
    readonly $$typeof: symbol;
}
  interface ErrorInfo {
    componentStack: string;
  }
  interface NewLifecycle<P, S, SS> {
    getSnapshotBeforeUpdate?(
      prevProps: Readonly<P>,
      prevState: Readonly<S>
    ): SS | null;
    componentDidUpdate?(
      prevProps: Readonly<P>,
      prevState: Readonly<S>,
      snapshot?: SS
    ): void;
  }
  interface ComponentLifecycle<P, S, SS = any>
    extends NewLifecycle<P, S, SS>,
      DeprecatedLifecycle<P, S> {
    componentDidMount?(): void;
    shouldComponentUpdate?(
      nextProps: Readonly<P>,
      nextState: Readonly<S>,
      nextContext: any
    ): boolean;
    componentWillUnmount?(): void;
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): void;
  }
  interface Component<P = {}, S = {}, SS = any>
    extends ComponentLifecycle<P, S, SS> {}
  class Component<P, S> {
    static contextType?: Context<any> | undefined;

    context: any;

    constructor(props: Readonly<P> | P);

    constructor(props: P, context: any);

    setState<K extends keyof S>(
      state:
        | ((
            prevState: Readonly<S>,
            props: Readonly<P>
          ) => Pick<S, K> | S | null)
        | (Pick<S, K> | S | null),
      callback?: () => void
    ): void;

    forceUpdate(callback?: () => void): void;
    render(): any;

    readonly props: Readonly<P> & Readonly<{ children?: any | undefined }>;
    state: Readonly<S>;

    refs: {
      [key: string]: any;
    };
  }

  const Fragment: ExoticComponent<{ children?: ReactNode | undefined }>;
}
declare module 'react-realize/lib/react-dom';
