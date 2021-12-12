/* eslint-disable no-console */
// import React from 'react';
// import ReactDOM from 'react-dom';
// import App from './App';

import React from 'react-realize/lib/react';
import { render } from 'react-realize/lib/react-dom';

render(<h1>hello word</h1>, document.querySelector('#root'), (context: any) => {
  console.log(context);
});

// import './index.css';

// ReactDOM.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>,
//   document.getElementById('root')
// );
