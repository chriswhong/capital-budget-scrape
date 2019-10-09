const fs = require('fs-extra')
const readline = require('readline')

const parseTxtFile = (inputDir, file, output) => {
  return new Promise ((resolve, reject) => {
    try {
      console.log(inputDir, file)

      const readInterface = readline.createInterface({
        input: fs.createReadStream(`${inputDir}/${file}`),
        console: false
      })

      // 0 or 1, representing the two pages that a single budget line appears across
      let startParsingLines = false
      let budgetPage

      let budgetLine

      const createEmptyBudgetLine = () => {
        return {
          id: '',
          fmsId: '',
          description: '',
          totalEstimatedCost: '',
          totalAppropriationAsOf: {},
          appropriationAvailableAsOf: {},
        }
      }

      const parseAdditionalFields = (line) => {
        const description = line.substring(10, 61).trim()
        // if line matches TOTALS FOR, return and reset budgetline
        if (/TOTALS FOR:/.test(description)) {
          budgetLine = createEmptyBudgetLine()
          return
        }

        budgetLine.description += description

        if (budgetLine.totalEstimatedCost !== 'CP') {
          const totalAppropriationAsOf = line.substring(83, 105).trim()
          if (totalAppropriationAsOf) {
            const [value] = totalAppropriationAsOf.split('(')
            const [type] = totalAppropriationAsOf.match(/([A-Z]{1,3})/)
            budgetLine.totalAppropriationAsOf[type] = parseInt(value)
          }
        }

        const appropriationAvailableAsOf = line.substring(108).trim()
        if (appropriationAvailableAsOf) {
          const [value] = appropriationAvailableAsOf.split('(')
          const [type] = appropriationAvailableAsOf.match(/([A-Z]{1,3})/)
          budgetLine.appropriationAvailableAsOf[type] = parseInt(value)
        }
      }

      readInterface.on('line', (line) => {
        if (/PRIOR APPROPRIATIONS/.test(line)) {
          startParsingLines = true
          budgetPage = 0
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
              if (budgetLine && budgetLine.id) console.log(budgetLine)
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
            console.log('parsing page 2 line', line)
            if (/------------------------------------------------------------------------------------------------------------------------------------/.test(line)) {
              if (budgetLine && budgetLine.id) console.log(budgetLine)
              budgetLine = createEmptyBudgetLine()
              return
            }

            // parse first line
            if (budgetLine.id === '') {
              // check to see if we are on the first line
              if (line.substring(0, 10).trim().match(/[A-Z]{1,2}-[A-Z0-9]{1,5}/)) {
                budgetLine.id = line.substring(0, 10).trim()
                // parseAdditionalFieldsPage2(line)
                return
              } else {
                startParsingLines = false
              }
            }
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
