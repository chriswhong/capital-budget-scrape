// amount of spaces at beginning of each line
// when converted using pdftotext
const OFFSET = 9 

const trimLine = (line) => {
  return line.substring(OFFSET)
}
const matchPattern = (start, end, line, pattern) => {
  return trimSubstring(start, end, line).match(pattern)
}

const trimSubstring = (start, end, line) => {
  if (end) return line.substring(start, end).trim()
  return line.substring(start).trim()
}

module.exports = {
  trimLine, matchPattern, trimSubstring
}
