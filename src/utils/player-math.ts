export const toLogVolume = (linear: number): number => {
  if (linear <= 0) return 0;
  if (linear >= 100) return 100;
  return Math.round(Math.pow(linear / 100, 2) * 100);
};
