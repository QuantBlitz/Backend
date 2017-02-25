const Promise = require('bluebird')

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
          .rightJoin(
            'stocks',
            'watchlist_stocks.stock_id',
            'stocks.id'
          )
          .where({
            watchlist_id: id
          })
      })
    },
    watchStock: (userID, stockID) => {
      return Promise.try(() => {
        return knex('watchlists')
          .where({ user_id: userID })
      }).then(data => {
        const { id } = data[0]
        return knex('watchlist_stocks')
          .returning(['watchlist_id'])
          .insert({
            watchlist_id: id,
            stock_id: stockID
          })
      }).then(data => {
        const { watchlist_id } = data[0]
        return knex('watchlist_stocks')
          .where({ watchlist_id })
          .rightJoin(
            'stocks',
            'watchlist_stocks.stock_id',
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
          .where({ portfolio_id: id })
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock_id',
            'stocks.id'
          )
      })
    },
    buyStock: (userID, stockID, data) => {
      const { shares, price } = data
      return Promise.try(() => {
        return knex('portfolios')
          .where({ user_id: userID })
      }).then(data => {
        const { id, capital } = data[0]
        return Promise.all([
          knex('portfolio_stocks')
            .returning(['portfolio_id'])
            .insert({
              shares,
              price,
              portfolio_id: id,
              stock_id: stockID,
              action: 'BUY'
            }),
          knex('portfolios')
            .where({ id })
            .update({ capital: +capital - (+shares * +price) })
        ])
      }).then(data => {
        const { portfolio_id } = data[0][0]
        return knex('portfolio_stocks')
          .select(portfolioColumnValues)
          .where({ portfolio_id })
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock_id',
            'stocks.id'
          )
      })
    },
    sellStock: (userID, stockID, data) => {
      const { shares, price } = data
      return Promise.try(() => {
        return knex('portfolios')
          .where({ user_id: userID })
      }).then(data => {
        const { id, capital } = data[0]
        return Promise.all([
          knex('portfolio_stocks')
            .returning(['portfolio_id'])
            .insert({
              portfolio_id: id,
              stock_id: stockID,
              shares: shares * -1,
              price: price,
              action: 'SELL'
            }),
          knex('portfolios')
            .where({ id })
            .update({ capital: +capital + (+shares * +price) })
        ])
      }).then(data => {
        const { portfolio_id } = data[0][0]
        return knex('portfolio_stocks')
          .select(portfolioColumnValues)
          .where({ portfolio_id })
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock_id',
            'stocks.id'
          )
      })
    }
  }
}
