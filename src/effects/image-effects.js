function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function getParameterValue(effect, name, fallback) {
  return effect?.parameters.find((parameter) => parameter.name === name)?.value ?? fallback
}

function applyBlackWhite(data, effect) {
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 100), 0, 100) / 100
  if (intensity === 0) return

  for (let offset = 0; offset < data.length; offset += 4) {
    const gray = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722
    data[offset] += (gray - data[offset]) * intensity
    data[offset + 1] += (gray - data[offset + 1]) * intensity
    data[offset + 2] += (gray - data[offset + 2]) * intensity
  }
}

function deterministicNoise(x, y) {
  let value = Math.imul(x + 1, 374761393) + Math.imul(y + 1, 668265263)
  value = Math.imul(value ^ (value >>> 13), 1274126177)
  return ((value >>> 0) / 4294967295) * 2 - 1
}

function applyGrain(data, width, height, effect, scale) {
  const grainSize = Math.max(1, Math.round(getParameterValue(effect, 'Tamaño', 2) * scale))
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 45), 0, 100) / 100
  const amplitude = intensity * 36
  if (intensity === 0) return

  for (let top = 0, grainY = 0; top < height; top += grainSize, grainY += 1) {
    for (let left = 0, grainX = 0; left < width; left += grainSize, grainX += 1) {
      const noise = deterministicNoise(grainX, grainY) * amplitude
      const bottom = Math.min(height, top + grainSize)
      const right = Math.min(width, left + grainSize)

      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const offset = (y * width + x) * 4
          data[offset] = clamp(data[offset] + noise, 0, 255)
          data[offset + 1] = clamp(data[offset + 1] + noise, 0, 255)
          data[offset + 2] = clamp(data[offset + 2] + noise, 0, 255)
        }
      }
    }
  }
}

function applyCmykShift(data, width, height, effect, scale) {
  const plateNames = ['Cian', 'Magenta', 'Amarillo', 'Negro']
  const channels = effect.channels || Object.fromEntries(plateNames.map((plate) => [plate, true]))
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 100), 0, 100) / 100
  if (intensity === 0) return

  const offsets = plateNames.map((plate) => ({
    x: Math.round(getParameterValue(effect, `Desplazamiento ${plate} horizontal`, 0) * scale),
    y: Math.round(getParameterValue(effect, `Desplazamiento ${plate} vertical`, 0) * scale),
  }))
  if (offsets.every(({ x, y }) => x === 0 && y === 0) && plateNames.every((plate) => channels[plate] !== false)) return

  const pixelCount = width * height
  const cyan = new Uint8Array(pixelCount)
  const magenta = new Uint8Array(pixelCount)
  const yellow = new Uint8Array(pixelCount)
  const black = new Uint8Array(pixelCount)

  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    const offset = pixel * 4
    const red = data[offset]
    const green = data[offset + 1]
    const blue = data[offset + 2]
    const key = 255 - Math.max(red, green, blue)
    black[pixel] = key

    if (key < 255) {
      const remaining = 255 - key
      cyan[pixel] = Math.round(((255 - red - key) / remaining) * 255)
      magenta[pixel] = Math.round(((255 - green - key) / remaining) * 255)
      yellow[pixel] = Math.round(((255 - blue - key) / remaining) * 255)
    }
  }

  const [cyanOffset, magentaOffset, yellowOffset, blackOffset] = offsets
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const output = (y * width + x) * 4
      const pixel = y * width + x
      const baseRed = data[output]
      const baseGreen = data[output + 1]
      const baseBlue = data[output + 2]
      const c = channels.Cian ? (cyanOffset.x === 0 && cyanOffset.y === 0 ? cyan[pixel] : cyan[clamp(y - cyanOffset.y, 0, height - 1) * width + clamp(x - cyanOffset.x, 0, width - 1)]) / 255 : 0
      const m = channels.Magenta ? (magentaOffset.x === 0 && magentaOffset.y === 0 ? magenta[pixel] : magenta[clamp(y - magentaOffset.y, 0, height - 1) * width + clamp(x - magentaOffset.x, 0, width - 1)]) / 255 : 0
      const yInk = channels.Amarillo ? (yellowOffset.x === 0 && yellowOffset.y === 0 ? yellow[pixel] : yellow[clamp(y - yellowOffset.y, 0, height - 1) * width + clamp(x - yellowOffset.x, 0, width - 1)]) / 255 : 0
      const k = channels.Negro ? (blackOffset.x === 0 && blackOffset.y === 0 ? black[pixel] : black[clamp(y - blackOffset.y, 0, height - 1) * width + clamp(x - blackOffset.x, 0, width - 1)]) / 255 : 0
      const shiftedRed = 255 * (1 - c) * (1 - k)
      const shiftedGreen = 255 * (1 - m) * (1 - k)
      const shiftedBlue = 255 * (1 - yInk) * (1 - k)
      data[output] = baseRed + (shiftedRed - baseRed) * intensity
      data[output + 1] = baseGreen + (shiftedGreen - baseGreen) * intensity
      data[output + 2] = baseBlue + (shiftedBlue - baseBlue) * intensity
    }
  }
}

function hexToRgb(hex) {
  const value = Number.parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function createIridescentPalette(brightness) {
  const palette = new Uint8Array(360 * 3)
  const lightness = 0.28 + brightness * 0.42
  const saturation = 0.9
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const offset = lightness - chroma / 2
  for (let hue = 0; hue < 360; hue += 1) {
    const segment = hue / 60
    const secondary = chroma * (1 - Math.abs(segment % 2 - 1))
    let red = 0, green = 0, blue = 0
    if (segment < 1) [red, green] = [chroma, secondary]
    else if (segment < 2) [red, green] = [secondary, chroma]
    else if (segment < 3) [green, blue] = [chroma, secondary]
    else if (segment < 4) [green, blue] = [secondary, chroma]
    else if (segment < 5) [red, blue] = [secondary, chroma]
    else [red, blue] = [chroma, secondary]
    const index = hue * 3
    palette[index] = Math.round((red + offset) * 255)
    palette[index + 1] = Math.round((green + offset) * 255)
    palette[index + 2] = Math.round((blue + offset) * 255)
  }
  return palette
}

function foilHash(x, y, salt) {
  const value = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453
  return value - Math.floor(value)
}

function applyHolographicFoil(data, width, height, effect, scale, options = {}) {
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 105), 0, 200) / 100
  const brightness = clamp(getParameterValue(effect, 'Brillo', 82), 0, 100) / 100
  const pattern = getParameterValue(effect, 'Patrón', 'Arcoíris espectral')
  const light = clamp(options.light ?? 100, 0, 100) / 100
  const tiltX = clamp(options.tiltX ?? 0, -28, 28) / 28
  const tiltY = clamp(options.tiltY ?? 0, -28, 28) / 28
  if (intensity === 0 || light === 0) return

  const palette = createIridescentPalette(brightness)
  const angle = Math.atan2(tiltY + 0.08, tiltX + 0.08)
  const directionX = Math.cos(angle)
  const directionY = Math.sin(angle)
  const scaleFactor = Math.max(0.01, scale)
  const imageWidth = width / scaleFactor
  const imageHeight = height / scaleFactor
  const sparkWidth = 108
  const sparkHeight = 76
  const sparkColumns = Math.ceil(imageWidth / sparkWidth)
  const sparkRows = Math.ceil(imageHeight / sparkHeight)
  const sparkFeatures = pattern === 'Destellos radiales' ? new Float32Array(sparkColumns * sparkRows * 5) : null
  if (sparkFeatures) {
    for (let row = 0; row < sparkRows; row += 1) {
      for (let column = 0; column < sparkColumns; column += 1) {
        const feature = (row * sparkColumns + column) * 5
        const horizontal = foilHash(column, row, 1)
        const vertical = foilHash(column, row, 2)
        sparkFeatures[feature] = column * sparkWidth + 12 + horizontal * (sparkWidth - 24)
        sparkFeatures[feature + 1] = row * sparkHeight + 10 + vertical * (sparkHeight - 20)
        sparkFeatures[feature + 2] = (foilHash(column, row, 3) - 0.5) * 1.2 + tiltX * 0.22 - tiltY * 0.12
        sparkFeatures[feature + 3] = 0.42 + foilHash(column, row, 4) * 0.58
        sparkFeatures[feature + 4] = foilHash(column, row, 5) * 115
      }
    }
  }
  for (let y = 0; y < height; y += 1) {
    const sourceY = y / scaleFactor
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      if (data[offset + 3] === 0) continue
      const sourceX = x / scaleFactor
      const luminance = (data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722) / 255
      const projection = sourceX * directionX + sourceY * directionY
      const wave = Math.cos(projection * 0.055 + tiltX * 2.8 - tiltY * 2.1)
      const glint = Math.pow(Math.max(0, wave), 6)
      const diffraction = Math.cos((sourceX * 1.25 + sourceY * 0.18) * Math.PI * 2 / 5 + tiltX * 3 - tiltY * 2)
      let patternHue = projection * 0.38 + luminance * 42
      let patternGlint = glint
      let baseCoverage = 0.19
      if (pattern === 'Prisma angular') {
        const fracture = Math.sin(sourceX * 0.019 + Math.sin(sourceY * 0.013 + tiltX) * 2.4) * 17
          + Math.sin(sourceY * 0.027 - sourceX * 0.008 + tiltY * 2) * 11
        const edgeFlashes = Math.pow(Math.max(0, Math.cos(projection * 0.082 + Math.sin(sourceY * 0.047) * 2.6 + tiltX)), 12)
        patternHue = (projection + fracture) * 0.66 + luminance * 28 + tiltX * 112 - tiltY * 88
        patternGlint = Math.max(glint * 0.45, edgeFlashes)
      } else if (pattern === 'Ondas') {
        const perpendicular = sourceX * -directionY + sourceY * directionX
        const curvedBand = projection + Math.sin(perpendicular * 0.026 + projection * 0.006 + tiltX * 2) * 26
        patternHue = curvedBand * 0.38 + luminance * 28 + tiltX * 118 - tiltY * 94
        patternGlint = Math.pow(Math.max(0, Math.cos(perpendicular * 0.062 + Math.sin(projection * 0.012) * 1.7 + tiltY)), 7)
      } else if (pattern === 'Destellos radiales') {
        const column = clamp(Math.floor(sourceX / sparkWidth), 0, sparkColumns - 1)
        const row = clamp(Math.floor(sourceY / sparkHeight), 0, sparkRows - 1)
        const feature = (row * sparkColumns + column) * 5
        const dx = sourceX - sparkFeatures[feature]
        const dy = sourceY - sparkFeatures[feature + 1]
        const featureAngle = sparkFeatures[feature + 2]
        const along = dx * Math.cos(featureAngle) + dy * Math.sin(featureAngle)
        const across = -dx * Math.sin(featureAngle) + dy * Math.cos(featureAngle)
        const curvedVein = across - Math.sin(along * 0.11 + sparkFeatures[feature + 4]) * 1.5
        const fleck = Math.exp(-(along * along / 240 + across * across / 3.2))
        const vein = Math.exp(-Math.abs(curvedVein) / 1.05) * Math.exp(-Math.abs(along) / 24)
        patternHue = projection * 0.2 + sparkFeatures[feature + 4] + tiltX * 102 - tiltY * 78
        patternGlint = Math.max(fleck, vein * 0.62) * sparkFeatures[feature + 3]
        baseCoverage = 0.025
      } else if (pattern === 'Microtrama de foil') {
        patternHue = projection * 0.43 + luminance * 34 + diffraction * 24 + tiltX * 138 - tiltY * 112
        patternGlint = Math.pow(Math.max(0, Math.cos(projection * 0.1 + diffraction * 2)), 5)
      } else {
        patternHue += tiltX * 138 - tiltY * 112
      }
      const hue = ((patternHue + diffraction * 7) % 360 + 360) % 360
      const colorOffset = Math.floor(hue) * 3
      const amount = clamp(intensity * light * (baseCoverage + patternGlint * 0.2) * (0.48 + brightness * 0.52) * 1.15, 0, 0.86)
      for (let channel = 0; channel < 3; channel += 1) {
        const foil = palette[colorOffset + channel]
        data[offset + channel] += (foil - data[offset + channel]) * amount
      }
    }
  }
}

function applyDuotone(data, effect) {
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 100), 0, 100) / 100
  if (intensity === 0) return

  const shadows = hexToRgb(getParameterValue(effect, 'Sombras', '#171447'))
  const highlights = hexToRgb(getParameterValue(effect, 'Luces', '#ff84bd'))
  for (let offset = 0; offset < data.length; offset += 4) {
    const luminance = (data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722) / 255
    for (let channel = 0; channel < 3; channel += 1) {
      const toned = shadows[channel] + (highlights[channel] - shadows[channel]) * luminance
      data[offset + channel] += (toned - data[offset + channel]) * intensity
    }
  }
}

function applyRgbShift(data, width, height, effect, scale) {
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 80), 0, 100) / 100
  const horizontal = Math.round(getParameterValue(effect, 'Desplazamiento horizontal', 12) * scale)
  const vertical = Math.round(getParameterValue(effect, 'Desplazamiento vertical', 0) * scale)
  if (intensity === 0 || (horizontal === 0 && vertical === 0)) return

  const source = new Uint8ClampedArray(data)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      const redX = clamp(x - horizontal, 0, width - 1)
      const redY = clamp(y - vertical, 0, height - 1)
      const blueX = clamp(x + horizontal, 0, width - 1)
      const blueY = clamp(y + vertical, 0, height - 1)
      const red = source[(redY * width + redX) * 4]
      const blue = source[(blueY * width + blueX) * 4 + 2]

      data[offset] += (red - data[offset]) * intensity
      data[offset + 2] += (blue - data[offset + 2]) * intensity
    }
  }
}

function applyGlitch(data, width, height, effect) {
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 55), 0, 100) / 100
  if (intensity === 0) return

  const source = new Uint8ClampedArray(data)
  const bandHeight = Math.max(1, Math.ceil(height / 36))
  const maximumShift = width * 0.035 * intensity

  for (let band = 0, top = 0; top < height; band += 1, top += bandHeight) {
    const random = Math.sin((band + 1) * 12.9898 + 78.233) * 43758.5453
    const noise = (random - Math.floor(random)) * 2 - 1
    const wave = noise * 0.72 + Math.sin((band + 1) * 2.41) * 0.28
    const shift = Math.round(wave * maximumShift)
    const bottom = Math.min(height, top + bandHeight)

    if (shift === 0) continue
    for (let y = top; y < bottom; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const sourceX = clamp(x - shift, 0, width - 1)
        const offset = (y * width + x) * 4
        const sourceOffset = (y * width + sourceX) * 4
        data[offset] = source[sourceOffset]
        data[offset + 1] = source[sourceOffset + 1]
        data[offset + 2] = source[sourceOffset + 2]
        data[offset + 3] = source[sourceOffset + 3]
      }
    }
  }
}

function applyHalftone(data, width, height, effect, scale) {
  const cellSize = Math.max(1, Math.round(getParameterValue(effect, 'Tamaño', 12) * scale))
  const contrast = clamp(getParameterValue(effect, 'Contraste', 78), 0, 100) / 100
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 85), 0, 100) / 100
  const shape = getParameterValue(effect, 'Forma de trama', 'Puntos')
  const orientation = getParameterValue(effect, 'Orientación', 'Horizontal')
  const mode = getParameterValue(effect, 'Modo', 'Colores originales')
  const ink = hexToRgb(getParameterValue(effect, 'Tinta', '#111018'))
  const paper = hexToRgb(getParameterValue(effect, 'Fondo', '#ed78ef'))
  const contrastFactor = 0.25 + contrast * 2

  if (intensity === 0) return
  const source = new Uint8ClampedArray(data)

  for (let cellTop = 0; cellTop < height; cellTop += cellSize) {
    const top = cellTop
    const bottom = Math.min(height, top + cellSize)
    const centerY = top + (bottom - top) / 2

    for (let cellLeft = 0; cellLeft < width; cellLeft += cellSize) {
      const left = cellLeft
      const right = Math.min(width, left + cellSize)
      const centerX = left + (right - left) / 2
      let luminance = 0
      let samples = 0
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const sample = (y * width + x) * 4
          if (source[sample + 3] === 0) continue
          luminance += source[sample] * 0.2126 + source[sample + 1] * 0.7152 + source[sample + 2] * 0.0722
          samples += 1
        }
      }
      if (!samples) continue
      luminance /= samples * 255
      const coverage = clamp(0.5 + (0.5 - luminance) * contrastFactor, 0, 1)
      const radius = (cellSize / 2) * Math.sqrt(coverage)

      for (let y = top; y < bottom; y += 1) {
        const dy = y + 0.5 - centerY
        for (let x = left; x < right; x += 1) {
          const dx = x + 0.5 - centerX
          const offset = (y * width + x) * 4
          if (source[offset + 3] === 0) continue
          const mask = halftoneCoverage(shape, orientation, dx, dy, radius)
          if (mask === 0) continue
          for (let channel = 0; channel < 3; channel += 1) {
            if (mode === 'Dos colores') {
              const patterned = paper[channel] + (ink[channel] - paper[channel]) * mask
              data[offset + channel] = source[offset + channel] + (patterned - source[offset + channel]) * intensity
            } else {
              const darkened = source[offset + channel] * (1 - mask * 0.9)
              data[offset + channel] = source[offset + channel] + (darkened - source[offset + channel]) * intensity
            }
          }
        }
      }
    }
  }
}

function halftoneCoverage(shape, orientation, dx, dy, radius) {
  if (radius <= 0) return 0
  let distance
  let width
  if (shape === 'Líneas') {
    distance = orientation === 'Vertical' ? Math.abs(dx) : Math.abs(dy)
    width = radius * 0.65
  } else if (shape === 'Diamante') {
    distance = Math.abs(dx) + Math.abs(dy)
    width = radius * 1.4
  } else {
    distance = Math.sqrt(dx * dx + dy * dy)
    width = radius
  }
  return clamp(width + 0.65 - distance, 0, 1)
}

function engravedLine(coordinate, pitch, warp, phase = 0) {
  const fraction = ((coordinate + warp + phase) / pitch % 1 + 1) % 1
  const distance = Math.min(fraction, 1 - fraction)
  return clamp(1 - distance * 5.2, 0, 1)
}

function applyEngraved(data, width, height, effect, scale) {
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 72), 0, 100) / 100
  const density = clamp(getParameterValue(effect, 'Densidad', 74), 0, 100) / 100
  const spacing = Math.max(1.5, (7.5 - density * 5.8) * scale)
  if (intensity === 0) return
  const source = new Uint8ClampedArray(data)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      if (source[offset + 3] === 0) continue
      const luminance = (source[offset] * 0.2126 + source[offset + 1] * 0.7152 + source[offset + 2] * 0.0722) / 255
      const darkness = 1 - luminance
      const warp = Math.sin(x * 0.013 + y * 0.057) * Math.max(0.3, scale)
      const lightHatch = engravedLine(x + y * 0.72, spacing, warp)
      const middleHatch = engravedLine(x - y * 0.72, spacing * 0.84, warp, 1.5)
      const shadowHatch = engravedLine(y + x * 0.12, spacing * 0.72, warp, 2.4)
      const mask = clamp((darkness - 0.08) / 0.82, 0, 1)
      const crossMask = clamp((darkness - 0.34) / 0.56, 0, 1)
      const deepMask = clamp((darkness - 0.68) / 0.3, 0, 1)
      const engraving = (lightHatch * (0.2 + mask * 0.42) + middleHatch * crossMask * 0.27 + shadowHatch * deepMask * 0.24)
      const amount = clamp(engraving * intensity, 0, 0.88)
      data[offset] *= 1 - amount
      data[offset + 1] *= 1 - amount
      data[offset + 2] *= 1 - amount
    }
  }
}

function applyBitmap(data, width, height, effect, scale) {
  const blockSize = Math.max(1, Math.round(getParameterValue(effect, 'Tamaño de bloque', 2) * scale))
  const threshold = clamp(getParameterValue(effect, 'Umbral', 50), 0, 100) * 2.55
  const ink = hexToRgb(getParameterValue(effect, 'Tinta', '#073b35'))
  const paper = hexToRgb(getParameterValue(effect, 'Fondo', '#a9f5d0'))

  for (let top = 0; top < height; top += blockSize) {
    const bottom = Math.min(height, top + blockSize)
    for (let left = 0; left < width; left += blockSize) {
      const right = Math.min(width, left + blockSize)
      let red = 0, green = 0, blue = 0, count = 0
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const offset = (y * width + x) * 4
          if (data[offset + 3] === 0) continue
          red += data[offset]
          green += data[offset + 1]
          blue += data[offset + 2]
          count += 1
        }
      }
      if (!count) continue
      const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / count
      const color = luminance < threshold ? ink : paper
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const offset = (y * width + x) * 4
          if (data[offset + 3] === 0) continue
          data[offset] = color[0]
          data[offset + 1] = color[1]
          data[offset + 2] = color[2]
        }
      }
    }
  }
}

function stripeCoverage(distance, halfWidth) {
  return clamp(halfWidth + 0.65 - Math.abs(distance), 0, 1)
}

function periodicLineDistance(position, period) {
  const phase = ((position % period) + period) % period
  return Math.min(phase, period - phase)
}

function ditheringCoverage(texture, dx, dy, localX, localY, cellSize, darkness) {
  const radius = Math.sqrt(darkness) * cellSize * 0.48
  if (texture === 'Puntos') {
    return clamp(radius + 0.65 - Math.sqrt(dx * dx + dy * dy), 0, 1)
  }
  if (texture === 'Líneas verticales') return stripeCoverage(dx, darkness * cellSize * 0.48)
  if (texture === 'Líneas horizontales') return stripeCoverage(dy, darkness * cellSize * 0.48)
  if (texture === 'Diagonales') {
    const diagonal = (dx + dy) * Math.SQRT1_2
    return stripeCoverage(periodicLineDistance(diagonal, cellSize), darkness * cellSize * 0.42)
  }
  if (texture === 'Trama cruzada') {
    const width = darkness * cellSize * 0.23
    const rising = stripeCoverage(periodicLineDistance((dx + dy) * Math.SQRT1_2, cellSize), width)
    const falling = stripeCoverage(periodicLineDistance((dx - dy) * Math.SQRT1_2, cellSize), width)
    return 1 - (1 - rising) * (1 - falling)
  }

  const edgeX = Math.min(localX, cellSize - localX)
  const edgeY = Math.min(localY, cellSize - localY)
  const width = darkness * cellSize * 0.24
  const vertical = stripeCoverage(edgeX, width)
  const horizontal = stripeCoverage(edgeY, width)
  return 1 - (1 - vertical) * (1 - horizontal)
}

function applyDithering(data, width, height, effect, scale) {
  const levels = Math.round(clamp(getParameterValue(effect, 'Niveles', 6), 2, 12))
  const intensity = clamp(getParameterValue(effect, 'Intensidad', 90), 0, 100) / 100
  const cellSize = Math.max(1, Math.round(getParameterValue(effect, 'Tamaño de puntos', 4) * scale))
  const mode = getParameterValue(effect, 'Modo', 'Dos colores')
  const texture = getParameterValue(effect, 'Textura', 'Puntos')
  const ink = hexToRgb(getParameterValue(effect, 'Tinta', '#100d14'))
  const paper = hexToRgb(getParameterValue(effect, 'Fondo', '#ed78ef'))
  if (intensity === 0) return

  const source = new Uint8ClampedArray(data)
  const columns = Math.ceil(width / cellSize)
  const rows = Math.ceil(height / cellSize)
  const tones = new Float32Array(columns * rows)
  const step = 255 / (levels - 1)

  // Sample an even grid, then diffuse quantization error between its neighbors.
  for (let row = 0; row < rows; row += 1) {
    const top = row * cellSize
    const bottom = Math.min(height, top + cellSize)
    for (let column = 0; column < columns; column += 1) {
      const left = column * cellSize
      const right = Math.min(width, left + cellSize)
      let luminance = 0
      let count = 0
      for (let y = top; y < bottom; y += 1) {
        for (let x = left; x < right; x += 1) {
          const offset = (y * width + x) * 4
          if (source[offset + 3] === 0) continue
          luminance += source[offset] * 0.2126 + source[offset + 1] * 0.7152 + source[offset + 2] * 0.0722
          count += 1
        }
      }
      tones[row * columns + column] = count ? luminance / count : -1
    }
  }

  for (let row = 0; row < rows; row += 1) {
    const reverse = row % 2 === 1
    for (let index = 0; index < columns; index += 1) {
      const column = reverse ? columns - 1 - index : index
      const cell = row * columns + column
      const value = tones[cell]
      if (value < 0) continue
      const quantized = Math.round(clamp(value, 0, 255) / step) * step
      const error = value - quantized
      tones[cell] = quantized
      const direction = reverse ? -1 : 1
      const sameRowColumn = column + direction
      if (sameRowColumn >= 0 && sameRowColumn < columns) {
        const target = row * columns + sameRowColumn
        if (tones[target] >= 0) tones[target] += error * 7 / 16
      }
      if (row + 1 < rows) {
        const downBackColumn = column - direction
        if (downBackColumn >= 0 && downBackColumn < columns) {
          const target = (row + 1) * columns + downBackColumn
          if (tones[target] >= 0) tones[target] += error * 3 / 16
        }
        const down = (row + 1) * columns + column
        if (tones[down] >= 0) tones[down] += error * 5 / 16
        const downForwardColumn = column + direction
        if (downForwardColumn >= 0 && downForwardColumn < columns) {
          const target = (row + 1) * columns + downForwardColumn
          if (tones[target] >= 0) tones[target] += error / 16
        }
      }
    }
  }

  for (let y = 0; y < height; y += 1) {
    const row = Math.floor(y / cellSize)
    const centerY = row * cellSize + cellSize / 2
    for (let x = 0; x < width; x += 1) {
      const offset = (y * width + x) * 4
      if (source[offset + 3] === 0) continue
      const column = Math.floor(x / cellSize)
      const tone = tones[row * columns + column]
      if (tone < 0) continue
      const centerX = column * cellSize + cellSize / 2
      const darkness = 1 - clamp(tone, 0, 255) / 255
      const localX = x - column * cellSize + 0.5
      const localY = y - row * cellSize + 0.5
      const patternCoverage = ditheringCoverage(texture, x + 0.5 - centerX, y + 0.5 - centerY, localX, localY, cellSize, darkness)

      for (let channel = 0; channel < 3; channel += 1) {
        let rendered
        if (mode === 'Dos colores') {
          const base = paper[channel] + (ink[channel] - paper[channel]) * patternCoverage
          rendered = source[offset + channel] + (base - source[offset + channel]) * intensity
        } else {
          const dot = source[offset + channel] * 0.08
          rendered = source[offset + channel] + (dot - source[offset + channel]) * patternCoverage * intensity
        }
        data[offset + channel] = rendered
      }
    }
  }
}

export function renderEffects(source, canvas, effects, scale = 1, options = {}) {
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return

  const width = canvas.width
  const height = canvas.height
  context.clearRect(0, 0, width, height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, width, height)

  const activeEffects = effects.filter((effect) => effect.enabled)
  if (!activeEffects.length) return

  const pixels = context.getImageData(0, 0, width, height)
  for (const effect of activeEffects) {
    if (effect.id === 'black-white') applyBlackWhite(pixels.data, effect)
    if (effect.id === 'halftone') applyHalftone(pixels.data, width, height, effect, scale)
    if (effect.id === 'engraved') applyEngraved(pixels.data, width, height, effect, scale)
    if (effect.id === 'bitmap') applyBitmap(pixels.data, width, height, effect, scale)
    if (effect.id === 'dithering') applyDithering(pixels.data, width, height, effect, scale)
    if (effect.id === 'rgb-shift') applyRgbShift(pixels.data, width, height, effect, scale)
    if (effect.id === 'glitch') applyGlitch(pixels.data, width, height, effect)
    if (effect.id === 'grain') applyGrain(pixels.data, width, height, effect, scale)
    if (effect.id === 'cmyk-shift') applyCmykShift(pixels.data, width, height, effect, scale)
    if (effect.id === 'duotone') applyDuotone(pixels.data, effect)
    if (effect.id === 'holographic-foil' && !options.skipHolographicFoil) applyHolographicFoil(pixels.data, width, height, effect, scale, options)
  }
  context.putImageData(pixels, 0, 0)
}
