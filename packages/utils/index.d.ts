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
