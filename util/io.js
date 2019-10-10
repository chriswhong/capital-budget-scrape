const fs = require('fs-extra')
const readline = require('readline')

const reader = (inputPath) => {
  return readline.createInterface({
    input: fs.createReadStream(inputPath),
    console: false
  })
}

const writer = (outputPath, data) => {
  fs.ensureFileSync(outputPath)
  const output = fs.createWriteStream(outputPath)
  output.write(JSON.stringify(data, null, 2))
}

module.exports = {
  reader,
  writer
}
