const Promise = require('bluebird')

const tradeColumns = [
  'portfolio_stocks.id',
  'username',
  'symbol',
  'shares',
  'price',
  'action'
]

module.exports = (knex) => {
  return {
    getUserTrades: (username) => {
      return Promise.try(() =>
        knex('portfolio_stocks')
          .select(tradeColumns)
          .where({ username })
          .joinRaw(
           `LEFT JOIN stocks ON portfolio_stocks.stock = stocks.id
            LEFT JOIN portfolios ON portfolio_stocks.portfolio = portfolios.id
            RIGHT JOIN users ON portfolios.user_id = users.id`
          )
          .orderBy('id', 'desc')
          .limit(5)
      ).then(data =>
        data
      )
    }    
  }
}
