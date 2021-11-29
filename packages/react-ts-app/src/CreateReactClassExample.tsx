/* eslint-disable no-console */
import React, {
  ComponentSpec,
  ClassicComponentClass,
  Mixin,
  ComponentLifecycle,
} from 'react';
import createReactClass from 'create-react-class';

interface IProps {
  title?: string;
}
interface IState {
  clickCount: number;
}

type C = ComponentSpec<IProps, IState>;

const lifecycle: ComponentLifecycle<IProps, IState> = {
  componentDidMount(this: C) {
    console.log('this', this);
    console.log(
      'CreateReactClassExample Static  A',
      (CreateReactClassExample as any).A
    );
    console.log('componentDidMount', this.state);
  },
};

const defaultMixin: Mixin<IProps, IState> = {
  mixins: [],
  statics: {
    A: 'A',
  },

  displayName: 'CreateReactClassExample',

  getDefaultProps() {
    return { title: 'title of default props' };
  },

  getInitialState() {
    return { clickCount: 0 };
  },

  ...lifecycle,
};

const spec: C = {
  ...defaultMixin,

  handleClick(e: any) {
    const { clickCount } = this.state;

    console.log(e);

    this.setState({ clickCount: clickCount + 1 });
  },

  render() {
    const { clickCount } = this.state;

    return (
      <span onClick={this.handleClick}>
        createReactClass click count {clickCount}
      </span>
    );
  },
};

export const CreateReactClassExample: ClassicComponentClass<IProps> =
  createReactClass<IProps, IState>(spec);
