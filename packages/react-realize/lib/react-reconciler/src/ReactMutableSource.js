const workInProgressSources = [];

const setWorkInProgressVersion = (mutableSource, version) => {
  mutableSource._workInProgressVersionPrimary = version;

  workInProgressSources.push(mutableSource);
};

const resetWorkInProgressVersions = () => {
  for (let i = 0; i < workInProgressSources.length; i++) {
    const mutableSource = workInProgressSources[i];
    mutableSource._workInProgressVersionPrimary = null;
  }
  workInProgressSources.length = 0;
};

export { setWorkInProgressVersion, resetWorkInProgressVersions };
