const PNG_SIGNATURE_LENGTH = 8

function readUint32(bytes, offset) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
}

function writeUint32(bytes, offset, value) {
  bytes[offset] = (value >>> 24) & 0xff
  bytes[offset + 1] = (value >>> 16) & 0xff
  bytes[offset + 2] = (value >>> 8) & 0xff
  bytes[offset + 3] = value & 0xff
}

function chunkType(bytes, offset) {
  return String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
}

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function createPhysChunk(pixelsPerMeter) {
  const chunk = new Uint8Array(21)
  writeUint32(chunk, 0, 9)
  chunk.set([0x70, 0x48, 0x59, 0x73], 4)
  writeUint32(chunk, 8, pixelsPerMeter)
  writeUint32(chunk, 12, pixelsPerMeter)
  chunk[16] = 1
  writeUint32(chunk, 17, crc32(chunk.subarray(4, 17)))
  return chunk
}

export function addPngDpiMetadata(input, dpi = 300) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  const parts = [bytes.slice(0, PNG_SIGNATURE_LENGTH)]
  const pixelsPerMeter = Math.round(dpi / 0.0254)
  const phys = createPhysChunk(pixelsPerMeter)
  let offset = PNG_SIGNATURE_LENGTH
  let inserted = false

  while (offset < bytes.length) {
    const length = readUint32(bytes, offset)
    const end = offset + 12 + length
    const type = chunkType(bytes, offset)
    if (type === 'pHYs') {
      if (!inserted) parts.push(phys)
      inserted = true
    } else {
      parts.push(bytes.slice(offset, end))
      if (type === 'IHDR' && !inserted) {
        parts.push(phys)
        inserted = true
      }
    }
    offset = end
  }

  const totalLength = parts.reduce((sum, part) => sum + part.length, 0)
  const output = new Uint8Array(totalLength)
  let writeOffset = 0
  for (const part of parts) {
    output.set(part, writeOffset)
    writeOffset += part.length
  }
  return output
}

export function readPngPixelsPerMeter(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input)
  let offset = PNG_SIGNATURE_LENGTH
  while (offset < bytes.length) {
    const length = readUint32(bytes, offset)
    if (chunkType(bytes, offset) === 'pHYs') return readUint32(bytes, offset + 8)
    offset += 12 + length
  }
  return null
}
