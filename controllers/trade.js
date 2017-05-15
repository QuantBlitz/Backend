const Promise = require('bluebird')

module.exports = (knex) => {
  return {
    getLatestTrades: () => {
      return Promise.try(() =>
        knex('latest_trades')
          .select('*')
      ).then(data =>
        data
      )
    }
  }
}
