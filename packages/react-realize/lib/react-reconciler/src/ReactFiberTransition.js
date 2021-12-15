import ReactSharedInternals from '../../ReactSharedInternals';

const { ReactCurrentBatchConfig } = ReactSharedInternals;

export const NoTransition = 0;

export const requestCurrentTransition = () =>
  ReactCurrentBatchConfig.transition;
