const path = require('path')
const { reader, writer } = require('./util/io')
const { matchPattern, trimSubstring } = require('./util/line')

const { BUDGETLINE_ID_PATTERN } = require('./util/patterns')

// grab inputPath, derive outputPath
const inputPath = process.argv[2]
const fileName = path.basename(inputPath, '.txt')
const outputPath = `data/${fileName}-geographic.json`

let geography = ''
let startParsingLines = false // toggled when we reach the line prior to the data we want to scrape
const items = []

// fire up a line-by-line reader
reader(inputPath)
  .on('line', (line) => {
  // pattern to start parsing
    if (/BOROUGH ANALYSIS OF /.test(line)) {
      startParsingLines = true
      return
    }

    if (startParsingLines) {
      if (matchPattern(0, 20, line, /(C I T Y W I D E|M A N H A T T A N|B R O N X|B R O O K L Y N|Q U E E N S|R I C H M O N D)/)) {
        switch (trimSubstring(0, 20, line)) {
          case 'C I T Y W I D E':
            geography = 'citywide'
            break

          case 'M A N H A T T A N':
            geography = 'manhattan'
            break

          case 'B R O N X':
            geography = 'bronx'
            break

          case 'B R O O K L Y N':
            geography = 'brooklyn'
            break

          case 'Q U E E N S':
            geography = 'queens'
            break

          case 'R I C H M O N D':
            geography = 'staten island'
            break
        }
      }

      if (matchPattern(0, 10, line, BUDGETLINE_ID_PATTERN)) {
        const id = trimSubstring(0, 10, line)

        // build an item to push to the array
        const item = {
          id,
          geography
        }
        // log it
        console.log(item)
        // push it
        items.push(item)
      }
    }
  })
  .on('close', () => {
    writer(outputPath, items)
  })
