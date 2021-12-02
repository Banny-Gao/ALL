declare module '*.svg' {
  const content: any;
  export default content;
  export const ReactComponent = content;
}

declare module 'react-realize/lib/react';
