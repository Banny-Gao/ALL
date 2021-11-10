/* eslint-disable import/no-extraneous-dependencies */
import fs from 'fs';
import { Compiler, webpack } from '@types/webpack';
import WebpackDevServer from '@types/webpack-dev-server';
import HtmlWebpackPlugin from '@types/html-webpack-plugin';
import { Handler } from '@types/express';

export interface INpmVersion {
  hasMinNpm: boolean;
  npmVersion: string;
}

export interface IYarnVersion {
  hasMinYarnPnp: boolean;
  hasMaxYarnPnp: boolean;
  yarnVersion: string;
}

export interface IUrls {
  lanUrlForConfig: any;
  lanUrlForTerminal?: string;
  localUrlForTerminal: string;
  localUrlForBrowser: string;
}

export const getNodeSemver: () => string[];

export const checkAppName: (name: string) => boolean;

export const isSafeToCreateProjectIn: (
  root: string,
  name: string,
) => boolean;

export const checkNpmCanReadCwd: () => boolean;

export const checkNpmVersion: () => INpmVersion;

export const checkYarnVersion: () => IYarnVersion;

export const getTemporaryDirectory: () => Promise<{
  tmpDir: string;
  cleanUp: () => void;
}>;

export const extractStream: (
  stream: fs.ReadStream,
  dest: string,
) => Promise<string>;

export const getPackageInfo: (
  package: string,
) => Promise<{ name: string; version?: string }>;

export const checkIfOnline: (useYarn: boolean) => Promise<boolean>;

export const getProxy: () => string | undefined;

export const install: (params: {
  root: string;
  useYarn: boolean;
  usePnp: boolean;
  dependencies: string[];
  verbose: boolean;
  isOnline: boolean;
}) => Promise<void>;

export const checkNodeVersion: (packageName: string) => void;

export const executeNodeScript: (
  options: { cwd: string; args: string[] },
  evaluateArgs: any[],
  evaluate: string,
) => Promise<void>;

export const defaultBrowsers: {
  production: string[];
  development: string[];
};

export const checkBrowsers: (
  dir: string,
  isInteractive: boolean,
  retry?: boolean,
) => Promise<string[] | boolean>;
export const openBrowser: (url: string) => boolean;

export const tryGitInit: () => boolean;
export const isInMercurialRepository: () => boolean;
export const isInGitRepository: () => boolean;

export const clearConsole: () => void;

export const getProcessIdOnPort: (port: number) => string;
export const getDirectoryOfProcessById: (processId: string) => string;
export const getProcessCommand: (processId: string) => string;
export const getProcessForPort: (port: number) => string | null;

export const formatWebpackMessages: (message: any) => string;
export const prepareUrls: (
  protocol: string,
  host: string,
  port: number | string,
  pathname: string,
) => IUrls;

export const checkRequiredFiles: (files: string[]) => boolean;
export const isRoot: () => boolean;

export const createCompiler: (
  config: {
    appName: string;
    urls: IUrls;
    useTypeScript: boolean;
    webpack: typeof webpack;
  },
  isPrintInstruction?: boolean,
) => Compiler;
export const prepareProxy: (
  proxy: string | undefined,
  appPublicFolder: string,
  servedPathname: string,
) => WebpackDevServer.ProxyConfigArray;
export const choosePort: (
  host: string,
  defaultPort: number,
) => Promise<number | null>;

export declare class InlineChunkHtmlPlugin extends webpack.Plugin {
  constructor(
    htmlWebpackPlugin: typeof HtmlWebpackPlugin,
    tests: ReadonlyArray<RegExp>,
  );
}
export declare class InterpolateHtmlPlugin extends webpack.Plugin {
  constructor(
    htmlWebpackPlugin: typeof HtmlWebpackPlugin,
    replacements: { [key: string]: string },
  );
}

export declare class ModuleScopePlugin extends webpack.Plugin {
  constructor(
    appSrc: string | ReadonlyArray<string>,
    allowedFiles?: ReadonlyArray<string>,
  );
}

export declare class ModuleNotFoundPlugin extends webpack.Plugin {
  constructor(appPath: string);
}

export declare const getCSSModuleLocalIdent: (
  context: webpack.loader.LoaderContext,
  localIdentName: string,
  localName: string,
  options: object,
) => string;

export declare const evalSourceMapMiddleware: (
  server: WebpackDevServer,
) => Handler;
export declare const noopServiceWorkerMiddleware: (
  servedPath: string,
) => Handler;
export declare const redirectServedPathMiddleware: (
  servedPath: string,
) => Handler;

export declare const getHttpsConfig: () =>
  | boolean
  | {
      cert: Buffer;
      key: Buffer;
    };

export declare const getCacheIdentifier: (
  environment: string,
  packages: ReadonlyArray<string>,
) => string;

export declare const createEnvironmentHash: (env: any) => string;

export declare const ignoredFiles: (appSrc: string) => RegExp;
