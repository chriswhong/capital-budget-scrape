const { COST_TYPE_PATTERN } = require('./patterns')

const formatCost = (rawCost) => {
  const cleanCost = rawCost.replace(/,/g, '').replace(/\$/g, '')
  let negative = false
  if (cleanCost.includes('-')) negative = true

  let formattedCost = parseInt(cleanCost, 10)

  if (negative) formattedCost *= -1

  return formattedCost
}

const parseCostAndAssign = (object, rawCost) => {
  const [value] = rawCost.split('(')
  const [type] = rawCost.match(COST_TYPE_PATTERN)
  object[type] = formatCost(value)
}

module.exports = {
  formatCost,
  parseCostAndAssign
}
