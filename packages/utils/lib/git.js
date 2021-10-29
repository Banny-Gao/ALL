const { execSync } = require('child_process');

const isInGitRepository = () => {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'ignore',
    });
    return true;
  } catch (e) {
    return false;
  }
};

const isInMercurialRepository = () => {
  try {
    execSync('hg --cwd . root', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

const tryGitInit = () => {
  try {
    execSync('git --version', { stdio: 'ignore' });
    if (isInGitRepository() || isInMercurialRepository()) {
      return false;
    }

    execSync('git init', { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = {
  tryGitInit,
  isInMercurialRepository,
  isInGitRepository,
};
