function isColorDark(r: number, g: number, b: number, a: number): boolean {
  if (a === 0) return false;
  // Perceived brightness formula (standard ITU-R BT.601)
  return 0.299 * r + 0.587 * g + 0.114 * b < 128;
}

function parseRGBA(rgba: string): [number, number, number, number] {
  const pfxLen = rgba.substring(0, 4) === 'rgba' ? 5 : 4;
  const rgbaNums = rgba
    .substring(pfxLen, rgba.length - 1)
    .split(',')
    .map((a) => parseFloat(a.trim()));
  const r =
    typeof rgbaNums[0] === 'number' && !isNaN(rgbaNums[0]) ? rgbaNums[0] : 255;
  const g =
    typeof rgbaNums[1] === 'number' && !isNaN(rgbaNums[1]) ? rgbaNums[1] : 255;
  const b =
    typeof rgbaNums[2] === 'number' && !isNaN(rgbaNums[2]) ? rgbaNums[2] : 255;
  const a =
    typeof rgbaNums[3] === 'number' && !isNaN(rgbaNums[3]) ? rgbaNums[3] : 1;
  return [r, g, b, a];
}

export default function isDarkMode(): boolean {
  const extRoot = document.body;
  const bgColor = getComputedStyle(extRoot).backgroundColor;
  if (bgColor) {
    const [r, g, b, a] = parseRGBA(bgColor);
    return isColorDark(r, g, b, a);
  }

  return false;
}
