const Promise = require('bluebird')
const bhttp = require('bhttp')

const baseURL = 'http://query.yahooapis.com/v1/public/yql?q='
const tailURL = '&format=json&env=store://datatables.org/alltableswithkeys'

const getYFinanceData = (query) => {
  return Promise.try(() =>
    bhttp.get(query)
  ).then(data =>
    data.body.query.results || []
  )
}

module.exports = {
  getSearchTerm: (term) => {
    const query = 'http://d.yimg.com/aq/autoc?query=' + term +
      '&region=US&lang=en-US'

    return Promise.try(() =>
      bhttp.get(query)
    ).then(data =>
      data.body.ResultSet
    )
  },
  getQuote: (symbols) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.quotes WHERE symbol IN ('${buffer}')`
    const query = `${baseURL}${YQL}${tailURL}`

    return getYFinanceData(query)
  },
  getNews: (symbols) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const query = `http://finance.yahoo.com/rss/headline?s=${buffer}`

    return Promise.try(() =>
      bhttp.get(query)
    ).then(data =>
      data.body.toString()
    )
  },
  getChartData: (symbols, start, end) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.historicaldata WHERE symbol = ` +
      `'${buffer}' AND startDate = '${start}' AND endDate = '${end}'`
    const query = `${baseURL}${YQL}${tailURL}`

    return getYFinanceData(query)
  },
  getChartSnapshot: (symbol) => {
    const query = `https://chart.finance.yahoo.com/z?s=${symbol}`

    return Promise.try(() =>
      bhttp.get(query)
    ).then(data =>
      data.body.toString()
    )
  },
  getDividendHistory: (symbol, start, end) => {
    const buffer = Array.isArray(symbols) ? symbols.join(',') : symbols
    const YQL = `SELECT * FROM yahoo.finance.dividendhistory WHERE symbol = ` +
      `'${buffer}' AND startDate = '${start}' AND endDate = '${end}'`
    const query = `${baseURL}${YQL}${tailURL}`

    return getYFinanceData(query)
  }
}
