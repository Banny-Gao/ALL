const maxYieldInterval = 300;
const deadline = 0;
const needsPaint = false;

const getCurrentTime = () => performance.now();

const shouldYieldToHost = () => {
  const currentTime = getCurrentTime();
  if (currentTime >= deadline) {
    if (needsPaint || scheduling.isInputPending()) {
      return true;
    }

    return currentTime >= maxYieldInterval;
  } else {
    return false;
  }
};

export { getCurrentTime, shouldYieldToHost };
