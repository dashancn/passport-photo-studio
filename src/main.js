import './style.css'
import { removeBackground } from '@imgly/background-removal'
import { mmToPx, resolvePhotoSize } from './lib/sizes.js'
import { getSheetPixels, calculateGridLayout, createCropMarks } from './lib/layout.js'
import { calculateCoverTransform, applyAdjustment, clampAdjustment } from './lib/transform.js'

const $ = (id) => document.getElementById(id)
const elements = Object.fromEntries(['fileInput','dropZone','removeBg','status','sizePreset','customSize','customWidth','customHeight','customColor','zoom','zoomValue','offsetX','offsetY','resetAdjust','photoCanvas','sheetCanvas','pixelInfo','sheetType','cropMarks','sheetInfo','downloadSingle','downloadSheet'].map((id) => [id, $(id)]))
const state = { image: null, sourceUrl: null, background: '#ffffff' }

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

function currentSize() {
  return resolvePhotoSize(elements.sizePreset.value, elements.customWidth.value, elements.customHeight.value)
}

function setStatus(message, error = false) {
  elements.status.textContent = message
  elements.status.style.color = error ? '#c62828' : '#667085'
}

async function acceptFile(file) {
  if (!file || !file.type.startsWith('image/')) return
  if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl)
  state.sourceUrl = URL.createObjectURL(file)
  try {
    state.image = await loadImage(state.sourceUrl)
    elements.removeBg.disabled = false
    elements.downloadSingle.disabled = false
    elements.downloadSheet.disabled = false
    setStatus('照片已载入，可直接调整或进行本地抠图')
    renderAll()
  } catch {
    setStatus('无法读取该图片，请更换文件', true)
  }
}

function renderPhoto() {
  if (!state.image) return
  let size
  try { size = currentSize() } catch (error) { setStatus(error.message, true); return }
  const width = mmToPx(size.widthMm)
  const height = mmToPx(size.heightMm)
  const canvas = elements.photoCanvas
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  context.fillStyle = state.background
  context.fillRect(0, 0, width, height)
  const bounded = clampAdjustment(elements.zoom.value / 100, elements.offsetX.value, elements.offsetY.value)
  const base = calculateCoverTransform(state.image.naturalWidth, state.image.naturalHeight, width, height)
  const draw = applyAdjustment(base, bounded.zoom, bounded.offsetX, bounded.offsetY)
  context.drawImage(state.image, draw.x, draw.y, draw.drawWidth, draw.drawHeight)
  elements.pixelInfo.textContent = `${size.label} · ${width}×${height}px · 300DPI`
}

function renderSheet() {
  if (!state.image || !elements.photoCanvas.width) return
  const sheet = getSheetPixels(elements.sheetType.value)
  const canvas = elements.sheetCanvas
  canvas.width = sheet.width
  canvas.height = sheet.height
  const context = canvas.getContext('2d')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  const gap = 38
  const layout = calculateGridLayout(canvas.width, canvas.height, elements.photoCanvas.width, elements.photoCanvas.height, gap)
  layout.items.forEach((item) => {
    context.save()
    if (item.rotated) {
      context.translate(item.x + item.width, item.y)
      context.rotate(Math.PI / 2)
      context.drawImage(elements.photoCanvas, 0, 0, item.height, item.width)
    } else {
      context.drawImage(elements.photoCanvas, item.x, item.y, item.width, item.height)
    }
    context.restore()
  })
  if (elements.cropMarks.checked) {
    context.strokeStyle = '#222'
    context.lineWidth = 2
    createCropMarks(layout.items, 20, 6).forEach((line) => {
      context.beginPath(); context.moveTo(line.x1, line.y1); context.lineTo(line.x2, line.y2); context.stroke()
    })
  }
  elements.sheetInfo.textContent = `${sheet.label} · 300DPI · 自动排入 ${layout.items.length} 张${layout.rotated ? '（旋转排版）' : ''}`
}

function renderAll() { renderPhoto(); renderSheet() }
function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}

elements.fileInput.addEventListener('change', (event) => acceptFile(event.target.files[0]))
;['dragenter','dragover'].forEach((type) => elements.dropZone.addEventListener(type, (event) => { event.preventDefault(); elements.dropZone.style.borderColor = '#246bfd' }))
;['dragleave','drop'].forEach((type) => elements.dropZone.addEventListener(type, (event) => { event.preventDefault(); elements.dropZone.style.borderColor = '' }))
elements.dropZone.addEventListener('drop', (event) => acceptFile(event.dataTransfer.files[0]))

elements.removeBg.addEventListener('click', async () => {
  if (!state.sourceUrl) return
  elements.removeBg.disabled = true
  setStatus('正在加载模型并在本地抠图，首次使用可能需要较长时间…')
  try {
    const blob = await removeBackground(state.sourceUrl, { progress: (key, current, total) => setStatus(`本地抠图：${key} ${Math.round(current / total * 100)}%`) })
    if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl)
    state.sourceUrl = URL.createObjectURL(blob)
    state.image = await loadImage(state.sourceUrl)
    setStatus('本地抠图完成，照片未上传到服务器')
    renderAll()
  } catch (error) {
    console.error(error)
    setStatus('抠图失败，请检查网络资源加载或尝试较小的照片', true)
  } finally { elements.removeBg.disabled = false }
})

document.querySelectorAll('.swatch').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.swatch').forEach((item) => item.classList.remove('active'))
  button.classList.add('active'); state.background = button.dataset.color; renderAll()
}))
elements.customColor.addEventListener('input', () => { document.querySelectorAll('.swatch').forEach((item) => item.classList.remove('active')); state.background = elements.customColor.value; renderAll() })
elements.sizePreset.addEventListener('change', () => { elements.customSize.classList.toggle('hidden', elements.sizePreset.value !== 'custom'); renderAll() })
;[elements.customWidth,elements.customHeight,elements.offsetX,elements.offsetY].forEach((input) => input.addEventListener('input', renderAll))
elements.zoom.addEventListener('input', () => { elements.zoomValue.value = `${elements.zoom.value}%`; renderAll() })
elements.resetAdjust.addEventListener('click', () => { elements.zoom.value = 100; elements.zoomValue.value = '100%'; elements.offsetX.value = 0; elements.offsetY.value = 0; renderAll() })
elements.sheetType.addEventListener('change', renderSheet)
elements.cropMarks.addEventListener('change', renderSheet)
elements.downloadSingle.addEventListener('click', () => downloadCanvas(elements.photoCanvas, `证件照-${currentSize().widthMm}x${currentSize().heightMm}mm.png`))
elements.downloadSheet.addEventListener('click', () => downloadCanvas(elements.sheetCanvas, `证件照拼版-${elements.sheetType.value}-300dpi.png`))
