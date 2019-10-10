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
      let geography
      let startParsingLines = false // toggled when we reach the line prior to the data we want to scrape

      const createEmptyBudgetLine = () => {
        return {
          id: '',
          geography: ''
        }
      }

      readInterface.on('line', (line) => {
        if (/BOROUGH ANALYSIS OF /.test(line)) {
          startParsingLines = true
          budgetLine = createEmptyBudgetLine()
          return
        }

        if (startParsingLines) {
          if (line.substring(0, 20).trim().match(/(C I T Y W I D E|M A N H A T T A N|B R O N X|B R O O K L Y N|Q U E E N S|R I C H M O N D)/)) {
            switch(line.substring(0, 20).trim()) {
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

          if (line.substring(0, 10).trim().match(/[A-Z]{1,2}-[A-Z0-9]{1,5}/)) {
            budgetLine.id = line.substring(0, 10).trim()
            budgetLine.geography = geography
            console.log(budgetLine)
            budgetLine = createEmptyBudgetLine()
            return
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
