/* eslint-disable no-console */
// import React from 'react';
// import ReactDOM from 'react-dom';
// import App from './App';

import React, { Component, Fragment } from 'react-realize/lib/react';
import { render } from 'react-realize/lib/react-dom';

interface IProp {
  onClick?: () => void;
}
interface IState {
  text: string;
}
class HelloWorld extends Component<IProp, IState> {
  state = {
    text: 'hello world',
  };

  render() {
    const { onClick } = this.props;
    const { text } = this.state;

    return (
      <Fragment>
        <span onClick={onClick}>{text}</span>
      </Fragment>
    );
  }
}

render(
  <HelloWorld onClick={() => console.log('Hello World')} />,
  document.querySelector('#root'),
  (context: any) => {
    console.log(context);
  }
);

// import './index.css';

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );
