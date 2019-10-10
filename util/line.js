const matchPattern = (start, end, line, pattern) => {
  return trimSubstring(start, end, line).match(pattern)
}

const trimSubstring = (start, end, line) => {
  if (end) return line.substring(start, end).trim()
  return line.substring(start).trim()
}

module.exports = {
  matchPattern, trimSubstring
}
