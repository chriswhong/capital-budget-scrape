const formatCost = (rawCost) => {
  const cleanCost = rawCost.replace(/,/g, '').replace(/\$/g, '')
  let negative = false
  if (cleanCost.includes('-')) negative = true

  let formattedCost = parseInt(cleanCost, 10)

  if (negative) formattedCost *= -1

  return formattedCost
}

module.exports = {
  formatCost
}
