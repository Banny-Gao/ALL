import { ReactNoopUpdateQueue } from './ReactNoopUpdateQueue';

export class Component {
  constructor(props, context, updater) {
    this.props = props;
    this.context = context;
    this.refs = {};
    this.updater = updater || ReactNoopUpdateQueue;
  }

  isReactComponent = {};

  setState(partialState, callback) {
    this.updater.enqueueSetState(
      this,
      partialState,
      callback,
      'setState'
    );
  }

  forceUpdate(callback) {
    this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
  }
}

export class PureComponent extends Component {
  isPureReactComponent = true;
}
