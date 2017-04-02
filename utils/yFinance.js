const Promise = require('bluebird')
const bhttp = require('bhttp')

const baseURL = 'http://query.yahooapis.com/v1/public/yql?q='
const tailURL = '&format=json&env=store://datatables.org/alltableswithkeys'

const getYFinanceData = (query) => {
  return Promise.try(() => {
    return bhttp.get(query)
  }).then(data =>
    data.body.query.results
  )
}

module.exports = {
  getQuote: (symbols) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.quotes WHERE symbol IN ('${buffer}')`
    const query = `${baseURL}${YQL}${tailURL}`

    return getYFinanceData(query)
  },
  getHistory: (symbols, start, end) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.historicaldata WHERE symbol = ` +
      `'${buffer}' AND startDate = '${start}' AND endDate = '${end}'`
    const query = `${baseURL}${YQL}${tailURL}`

    return getYFinanceData(query)
  },
  getDividendHistory: (symbol, start, end) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.dividendhistory WHERE symbol = ` +
      `'${buffer}' AND startDate = '${start}' AND endDate = '${end}'`
    const query = `${baseURL}${YQL}${tailURL}`

    return getYFinanceData(query)
  }
}
