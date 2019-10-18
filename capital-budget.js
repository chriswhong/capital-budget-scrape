const path = require('path')
const { reader, writer } = require('./util/io')
const { trimLine, matchPattern, trimSubstring } = require('./util/line')
const { formatCost, parseCostAndAssign } = require('./util/format')

const { BUDGETLINE_ID_PATTERN, getFY } = require('./util/patterns')

// grab inputPath, derive outputPath
const inputPath = process.argv[2]
const fileName = path.basename(inputPath, '.txt')
const outputPath = `data/${fileName}.json`

// 0 or 1, representing the two pages that a single budget line appears across
let fy
let budgetPage
let budgetLine
let startParsingLines = false // toggled when we reach the line prior to the data we want to scrape
let page2Index = -1
let pageItems = []
const items = []

const createEmptyBudgetLine = () => {
  return {
    fy,
    id: '',
    fmsId: '',
    description: '',
    totalEstimatedCost: '',
    totalAppropriationAsOf: {},
    appropriationAvailableAsOf: {},
    fy0: {},
    fy1: {},
    fy2: {},
    fy3: {},
    requiredToComplete: {},
    maintenanceAndOperation: '',
    estimatedDateOfCompletion: ''
  }
}

// after reading both pages and populating a set of budget lines,
// push each to the items array
const pushPageItems = () => {
  pageItems.forEach((item) => {
    console.log(item)
    items.push(item)
  })
}

const parsePage1Fields = (line) => {
  const description = trimSubstring(10, 61, line)
  // if line matches TOTALS FOR, return and reset budgetline
  if (/TOTALS FOR:/.test(description)) {
    budgetLine = createEmptyBudgetLine()
    return
  }

  // concatenate the description
  budgetLine.description = `${budgetLine.description.trim()} ${description}`

  if (budgetLine.totalEstimatedCost !== 'CP') {
    const totalAppropriationAsOf = trimSubstring(83, 105, line)
    if (totalAppropriationAsOf) {
      parseCostAndAssign(budgetLine.totalAppropriationAsOf, totalAppropriationAsOf)
    }
  }

  const appropriationAvailableAsOf = trimSubstring(108, null, line)
  if (appropriationAvailableAsOf) {
    parseCostAndAssign(budgetLine.appropriationAvailableAsOf, appropriationAvailableAsOf)
  }
}

const parsePage2Fields = (line) => {
  const fy0 = trimSubstring(11, 29, line)
  if (fy0) {
    parseCostAndAssign(pageItems[page2Index].fy0, fy0)
  }

  const fy1 = trimSubstring(30, 50, line)
  if (fy1) {
    parseCostAndAssign(pageItems[page2Index].fy1, fy1)
  }

  const fy2 = trimSubstring(50, 69, line)
  if (fy2) {
    parseCostAndAssign(pageItems[page2Index].fy2, fy2)
  }

  const fy3 = trimSubstring(69, 87, line)
  if (fy3) {
    parseCostAndAssign(pageItems[page2Index].fy3, fy3)
  }

  const requiredToComplete = trimSubstring(87, 106, line)
  if (requiredToComplete === 'CP') {
    pageItems[page2Index].requiredToComplete = 'CP'
  } else if (requiredToComplete) {
    parseCostAndAssign(pageItems[page2Index].requiredToComplete, requiredToComplete)
  }

  const maintenanceAndOperation = trimSubstring(106, 126, line)
  maintenanceAndOperation && (pageItems[page2Index].maintenanceAndOperation = formatCost(maintenanceAndOperation))

  const estimatedDateOfCompletion = trimSubstring(126, null, line)
  estimatedDateOfCompletion && (pageItems[page2Index].estimatedDateOfCompletion = estimatedDateOfCompletion)
}

reader(inputPath)
  .on('line', (line) => {
    line = trimLine(line)
    if (!fy) {
      fy = getFY(line)
    } 

    // start parsing lines page 1
    if (/PRIOR APPROPRIATIONS/.test(line)) {
      startParsingLines = true
      pushPageItems()
      budgetPage = 0
      page2Index = -1
      pageItems = []
      return
    }

    // start parsing lines page 2
    if (/COMPLETE {7}OPERATION {6}COMPLETION/.test(line)) {
      startParsingLines = true
      budgetPage = 1
      return
    }

    if (startParsingLines) {
      if (budgetPage === 0) {
        // parse first page lines
        if (/------------------------------------------------------------------------------------------------------------------------------------/.test(line)) {
          budgetLine && budgetLine.id && pageItems.push(budgetLine)
          budgetLine = createEmptyBudgetLine()
          return
        }
        // parse first line
        if (budgetLine.id === '') {
          // check to see if we are on the first line
          if (matchPattern(0, 10, line, BUDGETLINE_ID_PATTERN)) {
            budgetLine.id = trimSubstring(0, 10, line)
            const totalEstimatedCost = trimSubstring(63, 80, line)
            budgetLine.totalEstimatedCost = totalEstimatedCost === 'CP' ? totalEstimatedCost : formatCost(totalEstimatedCost)
            parsePage1Fields(line)
            return
          } else {
            // if id is empty and there is no id on this line, we have reached the end of page 1
            startParsingLines = false
          }
        }

        // parse second line
        if (budgetLine.fmsId === '') {
          budgetLine.fmsId = trimSubstring(0, 10, line)
          parsePage1Fields(line)
          return
        }

        parsePage1Fields(line)
      } else {
        if (/------------------------------------------------------------------------------------------------------------------------------------/.test(line)) {
          // if index is larger than size of pageItems, we have reached the end of page 2
          if (page2Index === pageItems.length - 1) {
            startParsingLines = false
            return
          }

          page2Index += 1
          return
        }

        parsePage2Fields(line)
      }
    }
  })
  .on('close', () => {
    writer(outputPath, items)
  })
