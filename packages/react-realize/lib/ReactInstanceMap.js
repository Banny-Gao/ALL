export const remove = (key) => {
  key._reactInternals = undefined;
};

export const get = (key) => {
  return key._reactInternals;
};

export const has = (key) => {
  return key._reactInternals !== undefined;
};

export const set = (key, value) => {
  key._reactInternals = value;
};
