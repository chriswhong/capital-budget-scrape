const path = require('path')
const { reader, writer } = require('./util/io')
const { trimLine, matchPattern, trimSubstring } = require('./util/line')
const { formatCost } = require('./util/format')

const { BUDGETLINE_ID_PATTERN, COST_TYPE_PATTERN, getFY } = require('./util/patterns')

// grab inputPath, derive outputPath
const inputPath = process.argv[2]
const fileName = path.basename(inputPath, '.txt')
const outputPath = `data/${fileName}-rescindments.json`

let fy
let budgetLineId = ''
let rescindments = {}
let startParsingLines = false // toggled when we reach the line prior to the data we want to scrape

const items = []

const parseRescindment = (line) => {
  const rescindment = trimSubstring(100, null, line)
  if (rescindment) {
    const [value] = rescindment.split('(')
    const [type] = rescindment.match(COST_TYPE_PATTERN)
    rescindments[type] = formatCost(value)
  }
}

const pushItem = () => {
  const item = {
    fy,
    id: budgetLineId,
    rescindments
  }
  console.log(item)
  items.push(item)

  // clear variables
  budgetLineId = ''
  rescindments = {}
}

// fire up a line-by-line reader
reader(inputPath)
  .on('line', (line) => {
    line = trimLine(line)
    if (!fy) {
      fy = getFY(line)
    } 

    // start parsing lines once this pattern is found
    if (/AMOUNT RESCINDED/.test(line)) {
      startParsingLines = true
      return
    }

    // stop parsing lines once this pattern is found
    if (/TOTALS FOR: PUBLIC BUILDINGS/.test(line) && startParsingLines) {
      pushItem()
      startParsingLines = false
      return
    }

    // skip
    if (/TOTALS FOR/.test(line)) {
      return
    }

    // skip
    if (/------------------------------------------------------------------------------------------------------------------------------------/.test(line)) {
      return
    }

    //
    if (startParsingLines) {
      if (matchPattern(0, 10, line, BUDGETLINE_ID_PATTERN)) {
        if (budgetLineId !== '') {
          pushItem()
        }
        // start a new item
        budgetLineId = trimSubstring(0, 10, line)
        parseRescindment(line)
        return
      }

      parseRescindment(line)
    }
  })
  .on('close', () => {
    writer(outputPath, items)
  })
