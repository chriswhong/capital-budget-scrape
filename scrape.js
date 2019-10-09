const fs = require('fs-extra')
const readline = require('readline')

const formatCost = (rawCost) => {
  let negative = false
  if (rawCost.includes('-')) negative = true

  let formattedCost = parseInt(rawCost.replace(/,/g, ''), 10)

  if (negative) formattedCost *= -1

  return formattedCost
}

const parseTxtFile = (inputDir, file, output) => {
  return new Promise ((resolve, reject) => {
    try {
      const readInterface = readline.createInterface({
        input: fs.createReadStream(`${inputDir}/${file}`),
        console: false
      })

      // 0 or 1, representing the two pages that a single budget line appears across
      let budgetPage
      let budgetLine
      let startParsingLines = false // toggled when we reach the line prior to the data we want to scrape
      let page2Index = -1
      let pageItems = []

      const createEmptyBudgetLine = () => {
        return {
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

      const parseAdditionalFields = (line) => {
        const description = line.substring(10, 61).trim()
        // if line matches TOTALS FOR, return and reset budgetline
        if (/TOTALS FOR:/.test(description)) {
          budgetLine = createEmptyBudgetLine()
          return
        }

        budgetLine.description = `${budgetLine.description.trim()} ${description}`

        if (budgetLine.totalEstimatedCost !== 'CP') {
          const totalAppropriationAsOf = line.substring(83, 105).trim()
          if (totalAppropriationAsOf) {
            const [value] = totalAppropriationAsOf.split('(')
            const [type] = totalAppropriationAsOf.match(/([A-Z]{1,3})/)
            budgetLine.totalAppropriationAsOf[type] = formatCost(value)
          }
        }

        const appropriationAvailableAsOf = line.substring(108).trim()
        console.log(appropriationAvailableAsOf)
        if (appropriationAvailableAsOf) {
          console.log('1', appropriationAvailableAsOf)
          const [value] = appropriationAvailableAsOf.split('(')
          console.log('2', value, parseInt(value, 10))
          const [type] = appropriationAvailableAsOf.match(/([A-Z]{1,3})/)
          budgetLine.appropriationAvailableAsOf[type] = formatCost(value)
        }
      }

      const parsePage2Fields = (line) => {
        const fy0 = line.substring(11, 29).trim()
        if (fy0) {
          const [value] = fy0.split('(')
          const [type] = fy0.match(/([A-Z]{1,3})/)
          pageItems[page2Index].fy0[type] = formatCost(value)
        }

        const fy1 = line.substring(30, 50).trim()
        if (fy1) {
          const [value] = fy1.split('(')
          const [type] = fy1.match(/([A-Z]{1,3})/)
          pageItems[page2Index].fy1[type] = formatCost(value)
        }

        const fy2 = line.substring(50, 69).trim()
        if (fy2) {
          const [value] = fy2.split('(')
          const [type] = fy2.match(/([A-Z]{1,3})/)
          pageItems[page2Index].fy2[type] = formatCost(value)
        }

        const fy3 = line.substring(69, 87).trim()
        if (fy3) {
          const [value] = fy3.split('(')
          const [type] = fy3.match(/([A-Z]{1,3})/)
          pageItems[page2Index].fy3[type] = formatCost(value)
        }

        const requiredToComplete = line.substring(87, 106).trim()
        if (requiredToComplete === 'CP') {
          pageItems[page2Index].requiredToComplete = 'CP'
        } else if (requiredToComplete) {
          const [value] = requiredToComplete.split('(')
          const [type] = requiredToComplete.match(/([A-Z]{1,3})/)
          pageItems[page2Index].requiredToComplete[type] = formatCost(value)
        }

        const maintenanceAndOperation = line.substring(106, 126).trim()
        maintenanceAndOperation && (pageItems[page2Index].maintenanceAndOperation = formatCost(maintenanceAndOperation))

        const estimatedDateOfCompletion = line.substring(126).trim()
        estimatedDateOfCompletion && (pageItems[page2Index].estimatedDateOfCompletion = estimatedDateOfCompletion)
      }

      readInterface.on('line', (line) => {
        if (/PRIOR APPROPRIATIONS/.test(line)) {
          console.log('START')
          startParsingLines = true
          budgetPage = 0
          page2Index = -1
          console.log(pageItems)
          pageItems = []
          return
        }
        if (/COMPLETE       OPERATION      COMPLETION/.test(line)) {
          startParsingLines = true
          budgetPage = 1
          return
        }

        if (startParsingLines) {
          if (budgetPage === 0) {
            //parse first page lines
            if (/------------------------------------------------------------------------------------------------------------------------------------/.test(line)) {
              budgetLine && budgetLine.id && pageItems.push(budgetLine)
              budgetLine = createEmptyBudgetLine()
              return
            }
            // parse first line
            if (budgetLine.id === '') {
              // check to see if we are on the first line
              if (line.substring(0, 10).trim().match(/[A-Z]{1,2}-[A-Z0-9]{1,5}/)) {
                budgetLine.id = line.substring(0, 10).trim()
                budgetLine.totalEstimatedCost = line.substring(63, 80).trim()
                parseAdditionalFields(line)
                return
              } else {
                // if id is empty and there is no id on this line, we have reached the end of page 1
                console.log('STOP')
                startParsingLines = false
              }
            }

            // parse second line
            if (budgetLine.fmsId === '') {
              budgetLine.fmsId = line.substring(0, 10).trim()
              parseAdditionalFields(line)
              return
            }

            parseAdditionalFields(line)
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
            console.log(page2Index, line)
            parsePage2Fields(line)
          }
        }
      })

      readInterface.on('close', () => {
        resolve()
      })
    } catch(e) {
      reject(e)
    }
  })
}

const inputFile = process.argv[2]
const fileName = inputFile.split('.')[0]
const outputPath = `csv/${fileName}.json`
fs.ensureFileSync(outputPath)
const output = fs.createWriteStream(outputPath)

parseTxtFile('txt', inputFile, output)
