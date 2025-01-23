import config from '~/config.json';

export const useColors = () => {
  function getLineColor(lineId: string | number): string {
    const black = '#000000';
    const lineIdStr = typeof lineId === "number" ? lineId.toString() : lineId
    const lineConfig = config.colors.find((colorInfo) => colorInfo.line === lineIdStr);
    if (!lineConfig) { return black; }
    return lineConfig.color;
  }

  return { getLineColor };
};
