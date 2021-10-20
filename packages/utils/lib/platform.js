const getNodeSemver = () => process.versions.node.split('.');

const isUsingYarn = () =>
  (process.env.npm_config_user_agent || '').indexOf('yarn') === 0;

module.exports = {
  getNodeSemver,
  isUsingYarn,
};
