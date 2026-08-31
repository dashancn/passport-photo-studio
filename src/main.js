import './style.css'
import { removeBackground } from '@imgly/background-removal'
import { mmToPx, resolvePhotoSize } from './lib/sizes.js'
import { getSheetPixels, calculateGridLayout, createCropMarks } from './lib/layout.js'
import { calculateCoverTransform, applyAdjustment, constrainAdjustment, clientDeltaToCanvas } from './lib/transform.js'
import { addPngDpiMetadata } from './lib/png.js'

const $ = (id) => document.getElementById(id)
const elements = Object.fromEntries(['fileInput','dropZone','removeBg','status','sizePreset','customSize','customWidth','customHeight','customColor','zoom','zoomValue','offsetX','offsetY','resetAdjust','photoCanvas','sheetCanvas','pixelInfo','sheetType','cropMarks','sheetInfo','downloadSingle','downloadSheet'].map((id) => [id, $(id)]))
const state = { image: null, sourceUrl: null, background: '#ffffff', selectionId: 0 }
const activePointers = new Map()
const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_IMAGE_PIXELS = 40_000_000

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
  if (file.size > MAX_FILE_BYTES) { setStatus('图片文件不能超过 25MB', true); return }
  const temporaryUrl = URL.createObjectURL(file)
  try {
    const image = await loadImage(temporaryUrl)
    if (image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) throw new Error('图片像素过大')
    const previousUrl = state.sourceUrl
    state.sourceUrl = temporaryUrl
    state.image = image
    state.selectionId += 1
    if (previousUrl) URL.revokeObjectURL(previousUrl)
    elements.removeBg.disabled = false
    elements.downloadSingle.disabled = false
    elements.downloadSheet.disabled = false
    setStatus('照片已载入，可直接调整或进行本地抠图')
    renderAll()
  } catch {
    URL.revokeObjectURL(temporaryUrl)
    setStatus('无法读取该图片，或图片尺寸超过 4000 万像素', true)
  }
}

function syncAdjustmentControls(adjustment) {
  elements.zoom.value = Math.round(adjustment.zoom * 100)
  elements.zoomValue.value = `${elements.zoom.value}%`
  elements.offsetX.min = -Math.ceil(Math.abs(adjustment.maxOffsetX ?? adjustment.offsetX))
  elements.offsetX.max = Math.ceil(Math.abs(adjustment.maxOffsetX ?? adjustment.offsetX))
  elements.offsetY.min = -Math.ceil(Math.abs(adjustment.maxOffsetY ?? adjustment.offsetY))
  elements.offsetY.max = Math.ceil(Math.abs(adjustment.maxOffsetY ?? adjustment.offsetY))
  elements.offsetX.value = adjustment.offsetX
  elements.offsetY.value = adjustment.offsetY
}

function getConstrainedAdjustment(zoom = elements.zoom.value / 100, offsetX = elements.offsetX.value, offsetY = elements.offsetY.value) {
  if (!state.image || !elements.photoCanvas.width || !elements.photoCanvas.height) return null
  const base = calculateCoverTransform(state.image.naturalWidth, state.image.naturalHeight, elements.photoCanvas.width, elements.photoCanvas.height)
  const adjustment = constrainAdjustment(base, elements.photoCanvas.width, elements.photoCanvas.height, zoom, offsetX, offsetY)
  return {
    ...adjustment,
    maxOffsetX: Math.max(0, (base.drawWidth * adjustment.zoom - elements.photoCanvas.width) / 2),
    maxOffsetY: Math.max(0, (base.drawHeight * adjustment.zoom - elements.photoCanvas.height) / 2)
  }
}

function setAdjustment(zoom, offsetX, offsetY) {
  const adjustment = getConstrainedAdjustment(zoom, offsetX, offsetY)
  if (!adjustment) return
  syncAdjustmentControls(adjustment)
  renderAll()
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
  const base = calculateCoverTransform(state.image.naturalWidth, state.image.naturalHeight, width, height)
  const bounded = constrainAdjustment(base, width, height, elements.zoom.value / 100, elements.offsetX.value, elements.offsetY.value)
  const maxOffsetX = Math.max(0, (base.drawWidth * bounded.zoom - width) / 2)
  const maxOffsetY = Math.max(0, (base.drawHeight * bounded.zoom - height) / 2)
  syncAdjustmentControls({ ...bounded, maxOffsetX, maxOffsetY })
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
  canvas.toBlob(async (blob) => {
    if (!blob) return
    const png = addPngDpiMetadata(new Uint8Array(await blob.arrayBuffer()), 300)
    const url = URL.createObjectURL(new Blob([png], { type: 'image/png' }))
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}

function pointerDistance(points) {
  return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
}

function pointerCenter(points) {
  return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
}

function canvasPoint(clientX, clientY) {
  const rect = elements.photoCanvas.getBoundingClientRect()
  return {
    x: (clientX - rect.left) * elements.photoCanvas.width / rect.width,
    y: (clientY - rect.top) * elements.photoCanvas.height / rect.height
  }
}

elements.photoCanvas.addEventListener('pointerdown', (event) => {
  if (!state.image) return
  elements.photoCanvas.setPointerCapture(event.pointerId)
  activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
  elements.photoCanvas.classList.add('is-dragging')
})

elements.photoCanvas.addEventListener('pointermove', (event) => {
  const previous = activePointers.get(event.pointerId)
  if (!previous || !state.image) return
  event.preventDefault()

  if (activePointers.size === 1) {
    const rect = elements.photoCanvas.getBoundingClientRect()
    const delta = clientDeltaToCanvas(event.clientX - previous.x, event.clientY - previous.y, elements.photoCanvas.width, elements.photoCanvas.height, rect.width, rect.height)
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    setAdjustment(elements.zoom.value / 100, Number(elements.offsetX.value) + delta.x, Number(elements.offsetY.value) + delta.y)
    return
  }

  if (activePointers.size === 2) {
    const oldPoints = [...activePointers.values()]
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const newPoints = [...activePointers.values()]
    const oldDistance = pointerDistance(oldPoints)
    const factor = oldDistance > 0 ? pointerDistance(newPoints) / oldDistance : 1
    const oldCenter = pointerCenter(oldPoints)
    const newCenter = pointerCenter(newPoints)
    const oldCanvasCenter = canvasPoint(oldCenter.x, oldCenter.y)
    const rect = elements.photoCanvas.getBoundingClientRect()
    const centerDelta = clientDeltaToCanvas(newCenter.x - oldCenter.x, newCenter.y - oldCenter.y, elements.photoCanvas.width, elements.photoCanvas.height, rect.width, rect.height)
    const zoom = Number(elements.zoom.value) / 100
    const offsetX = Number(elements.offsetX.value)
    const offsetY = Number(elements.offsetY.value)
    const canvasCenterX = elements.photoCanvas.width / 2
    const canvasCenterY = elements.photoCanvas.height / 2
    setAdjustment(
      zoom * factor,
      factor * offsetX + (1 - factor) * (oldCanvasCenter.x - canvasCenterX) + centerDelta.x,
      factor * offsetY + (1 - factor) * (oldCanvasCenter.y - canvasCenterY) + centerDelta.y
    )
  }
})

function releasePointer(event) {
  activePointers.delete(event.pointerId)
  if (activePointers.size === 0) elements.photoCanvas.classList.remove('is-dragging')
}

elements.photoCanvas.addEventListener('pointerup', releasePointer)
elements.photoCanvas.addEventListener('pointercancel', releasePointer)
elements.photoCanvas.addEventListener('lostpointercapture', releasePointer)
elements.photoCanvas.addEventListener('wheel', (event) => {
  if (!state.image) return
  event.preventDefault()
  const point = canvasPoint(event.clientX, event.clientY)
  const oldZoom = Number(elements.zoom.value) / 100
  const nextZoom = Math.min(3, Math.max(1, oldZoom * Math.exp(-event.deltaY * 0.0015)))
  const factor = nextZoom / oldZoom
  const canvasCenterX = elements.photoCanvas.width / 2
  const canvasCenterY = elements.photoCanvas.height / 2
  setAdjustment(
    nextZoom,
    factor * Number(elements.offsetX.value) + (1 - factor) * (point.x - canvasCenterX),
    factor * Number(elements.offsetY.value) + (1 - factor) * (point.y - canvasCenterY)
  )
}, { passive: false })

elements.fileInput.addEventListener('change', (event) => acceptFile(event.target.files[0]))
;['dragenter','dragover'].forEach((type) => elements.dropZone.addEventListener(type, (event) => { event.preventDefault(); elements.dropZone.style.borderColor = '#246bfd' }))
;['dragleave','drop'].forEach((type) => elements.dropZone.addEventListener(type, (event) => { event.preventDefault(); elements.dropZone.style.borderColor = '' }))
elements.dropZone.addEventListener('drop', (event) => acceptFile(event.dataTransfer.files[0]))

elements.removeBg.addEventListener('click', async () => {
  if (!state.sourceUrl) return
  const inputUrl = state.sourceUrl
  const selectionId = state.selectionId
  elements.removeBg.disabled = true
  setStatus('正在加载模型并在本地抠图，首次使用可能需要较长时间…')
  try {
    const blob = await removeBackground(inputUrl, { progress: (key, current, total) => {
      const percent = total > 0 ? Math.round(current / total * 100) : 0
      if (selectionId === state.selectionId) setStatus(`本地抠图：${key} ${percent}%`)
    } })
    if (selectionId !== state.selectionId || inputUrl !== state.sourceUrl) return
    const resultUrl = URL.createObjectURL(blob)
    const resultImage = await loadImage(resultUrl)
    if (selectionId !== state.selectionId || inputUrl !== state.sourceUrl) { URL.revokeObjectURL(resultUrl); return }
    URL.revokeObjectURL(inputUrl)
    state.sourceUrl = resultUrl
    state.image = resultImage
    state.selectionId += 1
    setStatus('本地抠图完成，照片未上传到服务器')
    renderAll()
  } catch (error) {
    console.error(error)
    if (selectionId === state.selectionId) setStatus('抠图失败，请检查网络资源加载或尝试较小的照片', true)
  } finally {
    elements.removeBg.disabled = false
  }
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
