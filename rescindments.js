const fs = require('fs-extra')
const readline = require('readline')

const formatCost = (rawCost) => {
  const cleanCost = rawCost.replace(/,/g, '').replace(/\$/g, '')
  let negative = false
  if (cleanCost.includes('-')) negative = true

  let formattedCost = parseInt(cleanCost, 10)

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

      let budgetLine
      let startParsingLines = false // toggled when we reach the line prior to the data we want to scrape

      const createEmptyBudgetLine = () => {
        return {
          id: '',
          fmsId: '',
          rescindments: {},
        }
      }

      const parseRescindment = (line) => {
        const rescindment = line.substring(100).trim()
        if (rescindment) {
          const [value] = rescindment.split('(')
          const [type] = rescindment.match(/([A-Z]{1,3})/)
          budgetLine.rescindments[type] = formatCost(value)
        }
      }

      readInterface.on('line', (line) => {
        if (/AMOUNT RESCINDED/.test(line)) {
          startParsingLines = true
          return
        }

        if (/TOTALS FOR: PUBLIC BUILDINGS/.test(line)) {
          console.log(budgetLine)
          startParsingLines = false
          return
        }

        if (/TOTALS FOR/.test(line)) {
          return
        }

        if (/------------------------------------------------------------------------------------------------------------------------------------/.test(line)) {
          return
        }

        if (startParsingLines) {
          if (line.substring(0, 10).trim().match(/[A-Z]{1,2}-[A-Z0-9]{1,5}/)) {
            console.log(budgetLine)
            budgetLine = createEmptyBudgetLine()
            budgetLine.id = line.substring(0, 10).trim()

            parseRescindment(line)
            return
          }

          if (budgetLine && budgetLine.fmsId === '') {
            budgetLine.fmsId = line.substring(0, 10).trim()
            parseRescindment(line)
            return
          }

          parseRescindment(line)
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
