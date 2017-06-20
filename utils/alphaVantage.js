const Promise = require('bluebird')
const bhttp = require('bhttp')

const { alpha_vantage } = require('../api_keys.json')

const baseURL = 'https://www.alphavantage.co/query?function='
const tailURL = '&apikey=' + alpha_vantage

const getAVData = (query) => {
  return Promise.try(() =>
    bhttp.get(query)
  ).then(data =>
    data.body
  )
}

module.exports = {
  getChartDaily: (symbol) => {
    const query = `${baseURL}TIME_SERIES_DAILY&symbol=${symbol}${tailURL}`
    return getAVData(query)
  }
}
