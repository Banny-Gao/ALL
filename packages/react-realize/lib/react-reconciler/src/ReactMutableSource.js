const workInProgressSources = [];

const setWorkInProgressVersion = (mutableSource, version) => {
  mutableSource._workInProgressVersionPrimary = version;

  workInProgressSources.push(mutableSource);
};

export {
  setWorkInProgressVersion
}