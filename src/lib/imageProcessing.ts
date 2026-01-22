import sharp from 'sharp'

const REMOVE_BG_API_KEY = process.env.REMOVE_BG_API_KEY

interface ProcessedImage {
  buffer: Buffer
  wasBackgroundRemoved: boolean
}

/**
 * Check if an image already has a white/light background
 * by sampling the corner pixels and edges
 */
async function hasWhiteBackground(imageBuffer: Buffer): Promise<boolean> {
  try {
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()
    const { width = 0, height = 0 } = metadata

    if (width === 0 || height === 0) return false

    // Get raw pixel data (resize to small version for faster processing)
    const sampleSize = 100
    const { data, info } = await image
      .resize(sampleSize, sampleSize, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const channels = info.channels

    // Sample corner regions (10x10 pixels in each corner)
    const cornerSize = 10
    const corners = [
      { x: 0, y: 0 }, // top-left
      { x: sampleSize - cornerSize, y: 0 }, // top-right
      { x: 0, y: sampleSize - cornerSize }, // bottom-left
      { x: sampleSize - cornerSize, y: sampleSize - cornerSize }, // bottom-right
    ]

    let whitePixelCount = 0
    let totalSampledPixels = 0

    for (const corner of corners) {
      for (let dy = 0; dy < cornerSize; dy++) {
        for (let dx = 0; dx < cornerSize; dx++) {
          const x = corner.x + dx
          const y = corner.y + dy
          const idx = (y * sampleSize + x) * channels

          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          // Check if pixel is white/near-white (threshold: 240+)
          if (r >= 240 && g >= 240 && b >= 240) {
            whitePixelCount++
          }
          totalSampledPixels++
        }
      }
    }

    // Also sample the edges (top and bottom rows)
    const edgeRows = [0, 1, 2, sampleSize - 3, sampleSize - 2, sampleSize - 1]
    for (const row of edgeRows) {
      for (let x = cornerSize; x < sampleSize - cornerSize; x++) {
        const idx = (row * sampleSize + x) * channels
        const r = data[idx]
        const g = data[idx + 1]
        const b = data[idx + 2]

        if (r >= 240 && g >= 240 && b >= 240) {
          whitePixelCount++
        }
        totalSampledPixels++
      }
    }

    // If more than 85% of sampled pixels are white, consider it a white background
    const whiteRatio = whitePixelCount / totalSampledPixels
    console.log(`White background check: ${(whiteRatio * 100).toFixed(1)}% white pixels`)

    return whiteRatio > 0.85
  } catch (error) {
    console.error('Error checking background:', error)
    return false // Assume not white if we can't check
  }
}

/**
 * Remove background using Remove.bg API
 */
async function removeBackground(imageBuffer: Buffer): Promise<Buffer | null> {
  if (!REMOVE_BG_API_KEY) {
    console.warn('Remove.bg API key not configured')
    return null
  }

  try {
    const formData = new FormData()
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(imageBuffer)
    formData.append('image_file', new Blob([uint8Array]), 'image.png')
    formData.append('size', 'auto')
    formData.append('bg_color', 'white') // Add white background after removal

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': REMOVE_BG_API_KEY,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Remove.bg API error:', error)
      return null
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer())
    console.log('Background removed successfully via Remove.bg')
    return resultBuffer
  } catch (error) {
    console.error('Error calling Remove.bg:', error)
    return null
  }
}

/**
 * Trim whitespace and normalize padding around the subject
 */
async function normalizeWhitespace(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const image = sharp(imageBuffer)
    const metadata = await image.metadata()

    // Trim whitespace (auto-detect edges)
    const trimmed = await image
      .trim({
        threshold: 10, // Sensitivity for detecting edges
        background: { r: 255, g: 255, b: 255 }, // White background
      })
      .toBuffer()

    // Get trimmed dimensions
    const trimmedMetadata = await sharp(trimmed).metadata()
    const trimmedWidth = trimmedMetadata.width || 0
    const trimmedHeight = trimmedMetadata.height || 0

    // Calculate target size with consistent padding (10% on each side)
    const paddingPercent = 0.10
    const maxDimension = Math.max(trimmedWidth, trimmedHeight)
    const targetSize = Math.ceil(maxDimension * (1 + paddingPercent * 2))

    // Make it square with centered content and white background
    const normalized = await sharp(trimmed)
      .resize(targetSize, targetSize, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255 },
      })
      .jpeg({ quality: 90 })
      .toBuffer()

    console.log(`Image normalized: ${metadata.width}x${metadata.height} → ${targetSize}x${targetSize}`)
    return normalized
  } catch (error) {
    console.error('Error normalizing whitespace:', error)
    // Return original if processing fails
    return imageBuffer
  }
}

/**
 * Main processing function:
 * 1. Check if image has white background
 * 2. If not, use Remove.bg to remove background
 * 3. Normalize whitespace/padding
 */
export async function processImage(imageBuffer: Buffer): Promise<ProcessedImage> {
  let workingBuffer = imageBuffer
  let wasBackgroundRemoved = false

  // Step 1: Check if background is already white
  const isWhiteBackground = await hasWhiteBackground(imageBuffer)
  console.log(`Background is white: ${isWhiteBackground}`)

  // Step 2: Remove background if not white
  if (!isWhiteBackground) {
    const removedBgBuffer = await removeBackground(imageBuffer)
    if (removedBgBuffer) {
      workingBuffer = removedBgBuffer
      wasBackgroundRemoved = true
    } else {
      console.warn('Background removal failed, proceeding with original image')
    }
  }

  // Step 3: Normalize whitespace and padding
  const normalizedBuffer = await normalizeWhitespace(workingBuffer)

  return {
    buffer: normalizedBuffer,
    wasBackgroundRemoved,
  }
}
