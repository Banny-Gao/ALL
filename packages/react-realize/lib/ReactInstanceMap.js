const remove = (key) => {
  key._reactInternals = undefined;
};

const get = (key) => {
  return key._reactInternals;
};

const has = (key) => {
  return key._reactInternals !== undefined;
};

const set = (key, value) => {
  key._reactInternals = value;
};

export { remove, get, has, set };
