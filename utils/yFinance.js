const Promise = require('bluebird')
const bhttp = require('bhttp')

const baseURL = 'http://query.yahooapis.com/v1/public/yql?q='
const tailURL = '&format=json&env=store://datatables.org/alltableswithkeys'

module.exports = {
  getQuote: (symbols) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.quotes WHERE symbol IN ('${buffer}')`

    return Promise.try(() => {
      return bhttp.get(`${baseURL}${YQL}${tailURL}`)
    }).then(data =>
      data.body.query.results
    )
  },
  getHistory: (symbols, start, end) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.historicaldata WHERE symbol = ` +
      `'${buffer}' AND startDate = '${start}' AND endDate = '${end}'`

    return Promise.try(() => {
      return bhttp.get(`${baseURL}${YQL}${tailURL}`)
    }).then(data =>
      data.body.query.results
    )
  },
  getDividendHistory: (symbol, start, end) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.dividendhistory WHERE symbol = ` +
      `'${buffer}' AND startDate = '${start}' AND endDate = '${end}'`

    return Promise.try(() => {
      return bhttp.get(`${baseURL}${YQL}${tailURL}`)
    }).then(data =>
      data.body.query.results
    )
  }
}
