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
