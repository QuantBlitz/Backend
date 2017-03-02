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
            'watchlist_stocks.stock',
            'stocks.id'
          )
          .where({
            watchlist: id
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
          .returning(['watchlist'])
          .insert({
            watchlist: id,
            stock: stockID
          })
      }).then(data => {
        const { watchlist } = data[0]
        return knex('watchlist_stocks')
          .where({ watchlist })
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
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock',
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
            .update({ capital: +capital - (+shares * +price) })
        ])
      }).then(data => {
        const { portfolio } = data[0][0]
        return knex('portfolio_stocks')
          .select(portfolioColumnValues)
          .where({ portfolio })
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock',
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
            .returning(['portfolio'])
            .insert({
              portfolio: id,
              stock: stockID,
              shares: shares * -1,
              price: price,
              action: 'SELL'
            }),
          knex('portfolios')
            .where({ id })
            .update({ capital: +capital + (+shares * +price) })
        ])
      }).then(data => {
        const { portfolio } = data[0][0]
        return knex('portfolio_stocks')
          .select(portfolioColumnValues)
          .where({ portfolio })
          .rightJoin(
            'stocks',
            'portfolio_stocks.stock',
            'stocks.id'
          )
      })
    }
  }
}
