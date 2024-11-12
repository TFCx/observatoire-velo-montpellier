import config from '~/config.json';

export const useUrl = () => {
  function withoutTrailingSlash(path: string): string {
    return path.endsWith('/') ? path.slice(0, -1) : path;
  }

  function getVoieCyclablePath(lineId: string) {
    return `/${config.slug}-${lineId}`;
  }

  function getLineIdRegex() {
    return new RegExp(`${config.slug}-(.*)\\b`);
  }

  return { withoutTrailingSlash, getVoieCyclablePath, getLineIdRegex };
};
