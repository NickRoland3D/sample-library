/**
 * Extract hashtags from a string
 * Supports tags like #bottle, #wine-red, #2024
 */
export function extractHashtags(text: string | null | undefined): string[] {
  if (!text) return []
  const matches = text.match(/#[\w-]+/g)
  return matches ? Array.from(new Set(matches.map(tag => tag.toLowerCase()))) : []
}

/**
 * Parse text and return segments with hashtags marked
 */
export function parseTextWithHashtags(text: string | null | undefined): Array<{ type: 'text' | 'hashtag'; content: string }> {
  if (!text) return []

  const segments: Array<{ type: 'text' | 'hashtag'; content: string }> = []
  const regex = /(#[\w-]+)/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    // Add text before the hashtag
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, match.index)
      })
    }

    // Add the hashtag
    segments.push({
      type: 'hashtag',
      content: match[1]
    })

    lastIndex = match.index + match[1].length
  }

  // Add remaining text after last hashtag
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex)
    })
  }

  return segments
}
