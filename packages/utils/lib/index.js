const platform = require('./platform');
const project = require('./project');
const npm = require('./npm');

module.exports = {
  ...platform,
  ...project,
  ...npm,
};
