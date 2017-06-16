const express = require('express')
const bhttp = require('bhttp')
const Promise = require('bluebird')
const stock = require('../controllers/stock')
const yFinance = require('../utils/yFinance')
const alphaVantage = require('../utils/alphaVantage')
const router = express.Router()

const { combineStocks, formatHistory } = require('../utils/utils')

module.exports = (knex) => {
  const handler = stock(knex)

  router.get('/input/:input', (req, res) => {
    Promise.try(() =>
      yFinance.getSearchTerm(req.params.input)
    ).then(data => {
      res.send(data.Result.filter(
        s => s.exchDisp == 'NASDAQ' || s.exchDisp == 'NYSE'
      ))
    })
  })

  router.get('/quote/:symbol', (req, res) => {
    const { symbol } = req.params

    Promise.try(() => {
      return yFinance.getQuote(symbol)
    }).then(data => {
      res.send(data)
    })
  })

  router.get('/news/:symbol', (req, res) => {
    const { symbol } = req.params

    Promise.try(() => {
      return yFinance.getNews(symbol)
    }).then(data => {
      console.log(data)
    })
  })

  router.get('/history/:symbol', (req, res) => {
    const { start, end } = req.query
    const { symbol } = req.params

    return Promise.try(() =>
      alphaVantage.getChartDaily(symbol)
    ).then(data => {
      const metadata = data['Time Series (Daily)']
      const output = formatHistory(metadata)
      res.status(200).send(output)
    })
  })

  router.get('/watchlist', (req, res) => {
    if (req.session.userID) {
      const { userID } = req.session
      Promise.try(() =>
        handler.getWatchlist(userID)
      ).then(data => {
        res.status(200).send(data)
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.get('/portfolio', (req, res) => {
    if (req.session.userID) {
      const { userID } = req.session
      Promise.try(() =>
        handler.getPortfolio(userID)
      ).then(data => {
        res.status(200).send({
          portfolio: combineStocks(data),
          trades: data
        })
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/watch', (req, res) => {
    if (req.session.userID) {
      const { company, symbol } = req.body
      const { userID } = req.session
      Promise.try(() =>
        knex('stocks')
          .where({ company, symbol })
      ).then(data => {
        if (data.length > 0) {
          const { id } = data[0]
          return Promise.try(() => {
            return handler.watchStock(userID, id)
          }).then(data => {
            res.status(200).send(data)
          })
        } else {
          return Promise.try(() => {
            return knex('stocks')
              .returning(['id'])
              .insert({ company, symbol })
          }).then(data => {
            const { id } = data[0]
            return handler.watchStock(userID, id)
          }).then(data => {
            res.status(200).send(data)
          })
        }
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/buy', (req, res) => {
    if (req.session.userID) {
      const { company, symbol, shares } = req.body
      const { userID } = req.session

      Promise.try(() => {
        return knex('stocks')
          .where({ company, symbol })
      }).then(data => {
        if (data.length > 0) {
          const { id } = data[0]
          return Promise.try(() => {
            return handler.buyStock(userID, id, { symbol, shares })
          }).then(data => {
            res.status(200).send({
              portfolio: combineStocks(data),
              trades: data
            })
          })
        } else {
          return Promise.try(() => {
            return knex('stocks')
              .returning(['id', 'symbol'])
              .insert({ company, symbol })
          }).then(data => {
            const { id } = data[0]
            return handler.buyStock(userID, id, { symbol, shares })
          }).then(data => {
            res.status(200).send({
              portfolio: combineStocks(data),
              trades: data
            })
          })
        }
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/sell', (req, res) => {
    if (req.session.userID) {
      const { company, symbol, shares } = req.body
      const { userID } = req.session

      Promise.try(() => {
        return knex('stocks')
          .where({ company, symbol })
      }).then(data => {
        if (data.length > 0) {
          const { id, symbol } = data[0]
          return Promise.try(() => {
            return handler.sellStock(userID, id, { symbol, shares })
          }).then(data => {
            res.status(200).send({
              portfolio: combineStocks(data),
              trades: data
            })
          })
        } else {
          return Promise.try(() => {
            return knex('stocks')
              .returning(['id', 'symbol'])
              .insert({ company, symbol })
          }).then(data => {
            const { id, symbol } = data[0]
            return handler.sellStock(userID, id, { symbol, shares })
          }).then(data => {
            res.status(200).send({
              portfolio: combineStocks(data),
              trades: data
            })
          })
        }
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  return router
}
