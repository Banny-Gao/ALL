import { ReactNoopUpdateQueue } from './ReactNoopUpdateQueue';

export class Component {
  constructor(props, context, updater) {
    this.props = props;
    this.context = context;
    this.refs = {};
    this.updater = updater || ReactNoopUpdateQueue;
  }
}

Component.prototype.isReactComponent = {};

Component.prototype.setState = function (partialState, callback) {
  this.updater.enqueueSetState(
    this,
    partialState,
    callback,
    'setState'
  );
};

Component.prototype.forceUpdate = function (callback) {
  this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
};

export class PureComponent extends Component {}

PureComponent.prototype.isPureReactComponent = true;
