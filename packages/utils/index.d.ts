import fs from 'fs';

export interface INpmVersion {
  hasMinNpm: boolean;
  npmVersion: string;
}

export interface IYarnVersion {
  hasMinYarnPnp: boolean;
  hasMaxYarnPnp: boolean;
  yarnVersion: string;
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
) => {
  lanUrlForConfig: any;
  lanUrlForTerminal?: string;
  localUrlForTerminal: string;
  localUrlForBrowser: string;
};

export const checkRequiredFiles: (files: string[]) => boolean;
