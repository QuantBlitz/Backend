const Promise = require('bluebird')

const tradeColumns = [
  'stock_transactions.id',
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
        knex('stock_transactions')
          .select(tradeColumns)
          .where({ username })
          .joinRaw(
           `LEFT JOIN stocks ON stock_transactions.stock = stocks.id
            LEFT JOIN portfolios ON stock_transactions.portfolio = portfolios.id
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
