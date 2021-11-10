const fs = require('fs-extra');

const {
  evalSourceMapMiddleware,
  noopServiceWorkerMiddleware,
  redirectServedPathMiddleware,
  ignoredFiles,
  getHttpsConfig,
} = require('utils');

const paths = require('./paths');

const host = process.env.HOST || '0.0.0.0';
const sockHost = process.env.WDS_SOCKET_HOST;
const sockPath = process.env.WDS_SOCKET_PATH; // default: '/ws'
const sockPort = process.env.WDS_SOCKET_PORT;

const createDevServerConfig = (proxy, allowedHost) => {
  const disableFirewall =
    !proxy || process.env.DANGEROUSLY_DISABLE_HOST_CHECK === 'true';

  return {
    allowedHosts: disableFirewall ? 'all' : [allowedHost],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*',
    },
    compress: true,
    static: {
      directory: paths.appPublic,
      publicPath: [paths.publicPath],
      watch: {
        ignored: ignoredFiles(paths.appSrc),
      },
    },
    client: {
      webSocketURL: {
        hostname: sockHost,
        pathname: sockPath,
        port: sockPort,
      },
      overlay: true,
    },
    devMiddleware: {
      publicPath: paths.publicPath.slice(0, -1),
    },
    https: getHttpsConfig(),
    host,
    historyApiFallback: {
      disableDotRule: true,
      index: paths.publicPath,
    },
    proxy,
    onBeforeSetupMiddleware(devServer) {
      devServer.app.use(evalSourceMapMiddleware(devServer));

      if (fs.existsSync(paths.proxySetup)) {
        require(paths.proxySetup)(devServer.app);
      }
    },
    onAfterSetupMiddleware(devServer) {
      devServer.app.use(redirectServedPathMiddleware(paths.publicPath));
      devServer.app.use(noopServiceWorkerMiddleware(paths.publicPath));
    },
  };
};

module.exports = createDevServerConfig;
