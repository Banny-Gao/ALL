export const NoLanePriority = 0;

export const createLaneMap = (initial) =>
  Array(31)
    .fill(0)
    .map(() => initial);

export const NoLanes = 0b0000000000000000000000000000000;

export const NoTimestamp = -1;
