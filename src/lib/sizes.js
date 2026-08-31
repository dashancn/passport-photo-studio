export const PHOTO_PRESETS = {
  oneInch: { widthMm: 25, heightMm: 35, label: '一寸 25×35mm' },
  twoInch: { widthMm: 35, heightMm: 49, label: '二寸 35×49mm' },
  passport: { widthMm: 33, heightMm: 48, label: '护照 33×48mm' },
  '35x45': { widthMm: 35, heightMm: 45, label: '签证 35×45mm' },
  'us-2x2': { widthMm: 50.8, heightMm: 50.8, label: '美国 2×2in' }
}

export function inchesToPx(inches, dpi = 300) {
  return Math.round(inches * dpi)
}

export function mmToPx(mm, dpi = 300) {
  return Math.round((mm / 25.4) * dpi)
}

export function resolvePhotoSize(key, customWidth, customHeight) {
  if (key !== 'custom') {
    const preset = PHOTO_PRESETS[key]
    if (!preset) throw new Error('未知尺寸预设')
    return { ...preset }
  }
  const widthMm = Number(customWidth)
  const heightMm = Number(customHeight)
  if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm <= 0 || heightMm <= 0) {
    throw new Error('自定义宽高必须是正数')
  }
  if (widthMm > 300 || heightMm > 300) throw new Error('自定义宽高应不超过 300mm')
  return { widthMm, heightMm, label: `自定义 ${widthMm}×${heightMm}mm` }
}
