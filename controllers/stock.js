const Promise = require('bluebird')
const yFinance = require('../utils/yFinance')

const portfolioColumnValues = [
  'portfolio_stocks.id',
  'company',
  'symbol',
  'shares',
  'price',
  'action'
]

module.exports = (knex) => {
  return {
    getWatchlist: (userID) => {
      return Promise.try(() => {
        return knex('watchlists')
          .where({ user_id: userID })
      }).then(data => {
        const { id } = data[0]
        const columnValues = [
          'watchlist_stocks.id',
          'watchlist_stocks.date_deleted',
          'company',
          'symbol'
        ]
        return knex('watchlist_stocks')
          .select(columnValues)
          .where({
            watchlist: id
          })
          .orderBy('id', 'desc')
          .limit(20)
          .rightJoin(
            'stocks',
            'watchlist_stocks.stock',
            'stocks.id'
          )
      })
    },
    watchStock: (userID, stockID) => {
      return Promise.try(() => {
        return knex('watchlists')
          .where({ user_id: userID })
      }).then(data => {
        const { id } = data[0]
        return knex('watchlist_stocks')
          .returning(['watchlist'])
          .insert({
            watchlist: id,
            stock: stockID
          })
      }).then(data => {
        const { watchlist } = data[0]
        return knex('watchlist_stocks')
          .where({ watchlist })
          .orderBy('id', 'desc')
          .limit(20)
          .rightJoin(
            'stocks',
            'watchlist_stocks.stock',
            'stocks.id'
          )
      })
    },
    getPortfolio: (userID) => {
      return Promise.try(() => {
        return knex('portfolios')
          .where({ user_id: userID })
      }).then(data => {
        const { id } = data[0]
        return knex('portfolio_stocks')
          .select(portfolioColumnValues)
          .where({ portfolio: id })
          .orderBy('id', 'desc')
          .limit(20)
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock',
            'stocks.id'
          )
      })
    },
    buyStock: (userID, stockID, data) => {
      const { symbol, shares } = data

      return Promise.try(() => {
        return Promise.all([
          knex('portfolios')
            .where({ user_id: userID }),
          yFinance.getQuote(symbol)
        ])
      }).then(data => {
        const { id, capital } = data[0][0]
        const { quote } = data[1]
        const price = +quote.LastTradePriceOnly

        return Promise.all([
          knex('portfolio_stocks')
            .returning(['portfolio'])
            .insert({
              shares,
              price,
              portfolio: id,
              stock: stockID,
              action: 'BUY'
            }),
          knex('portfolios')
            .where({ id })
            .update({ capital: +capital - (+shares * price) })
        ])
      }).then(data => {
        const { portfolio } = data[0][0]
        return knex('portfolio_stocks')
          .select(portfolioColumnValues)
          .where({ portfolio })
          .orderBy('id', 'desc')
          .limit(20)
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock',
            'stocks.id'
          )
      })
    },
    sellStock: (userID, stockID, data) => {
      const { symbol, shares } = data

      return Promise.try(() => {
        return Promise.all([
          knex('portfolios')
            .where({ user_id: userID }),
          yFinance.getQuote(symbol)
        ])
      }).then(data => {
        const { id, capital } = data[0][0]
        const { quote } = data[1]
        const price = +quote.LastTradePriceOnly

        return Promise.all([
          knex('portfolio_stocks')
            .returning(['portfolio'])
            .insert({
              price,
              portfolio: id,
              stock: stockID,
              shares: shares * -1,
              action: 'SELL'
            }),
          knex('portfolios')
            .where({ id })
            .update({ capital: +capital + (+shares * price) })
        ])
      }).then(data => {
        const { portfolio } = data[0][0]
        return knex('portfolio_stocks')
          .select(portfolioColumnValues)
          .where({ portfolio })
          .orderBy('id', 'desc')
          .limit(20)
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock',
            'stocks.id'
          )
      })
    }
  }
}
