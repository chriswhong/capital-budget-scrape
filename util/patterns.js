const BUDGETLINE_ID_PATTERN = /[A-Z]{1,2}-[A-Z0-9]{1,5}/

const COST_TYPE_PATTERN = /([A-Z]{1,3})/

const getFY = (line) => {
  if (/Fiscal\s+Year\s+20/.test(line)) {
    return "fy" + line.trim().slice(-2)
  }
  return null
}

module.exports = {
  BUDGETLINE_ID_PATTERN,
  COST_TYPE_PATTERN,
  getFY
}
