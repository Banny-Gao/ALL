import React, { Component, ErrorInfo } from 'react';

interface IErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

type IErrorBoundaryProps = any;
type IErrorBoundarySnapshot = any;

export class ErrorBoundary extends Component<
  IErrorBoundaryProps,
  IErrorBoundaryState,
  IErrorBoundarySnapshot
> {
  state: IErrorBoundaryState = {
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error) {
    // eslint-disable-next-line no-console
    console.log(error, 'from getDerivedStateFromError');

    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo,
    });
    // You can also log error messages to an error reporting service here
  }

  render() {
    const { error, errorInfo } = this.state;

    if (errorInfo)
      return (
        <div>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {error?.toString()}
            <br />
            {errorInfo.componentStack}
          </details>
        </div>
      );
    // Normally, just render children
    return this.props.children;
  }
}

interface IBuggyCounterState {
  counter: number;
}

export class BuggyCounter extends Component<any, IBuggyCounterState> {
  state = {
    counter: 0,
  };

  handleClick = () => {
    this.setState(({ counter }) => ({
      counter: counter + 1,
    }));
  };

  render() {
    if (this.state.counter === 5) {
      // Simulate a JS error
      throw new Error('I crashed!');
    }
    return <h1 onClick={() => this.handleClick()}>{this.state.counter}</h1>;
  }
}
