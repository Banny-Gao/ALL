import { ReactCurrentBatchConfig } from './ReactCurrentBatchConfig';

export const startTransition = (scope) => {
  const prevTransition = ReactCurrentBatchConfig.transition;
  ReactCurrentBatchConfig.transition = 1;

  try {
    scope();
  } finally {
    ReactCurrentBatchConfig.transition = prevTransition;
  }
};
