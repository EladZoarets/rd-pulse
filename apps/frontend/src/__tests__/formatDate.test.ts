import { formatDate, formatRelative } from '../utils/formatDate'

describe('formatDate', () => {
  it('formats an ISO string to a readable date', () => {
    expect(formatDate('2026-04-12T10:00:00Z')).toContain('2026')
    expect(formatDate('2026-04-12T10:00:00Z')).toContain('Apr')
  })

  it('formatRelative returns "just now" for very recent dates', () => {
    const now = new Date().toISOString()
    expect(formatRelative(now)).toBe('just now')
  })

  it('formatRelative returns hours for dates within the day', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    expect(formatRelative(twoHoursAgo)).toBe('2h ago')
  })
})
