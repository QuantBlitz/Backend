const express = require('express')
const bhttp = require('bhttp')
const yFinance = require('yfinance')
const Promise = require('bluebird')
const stock = require('../controllers/stock')
const router = express.Router()

const { combineStocks } = require('../utils/utils')

module.exports = (knex) => {
  const handler = stock(knex)

  router.get('/input/:input', (req, res) => {
    const baseURL = 'http://dev.markitondemand.com/MODApis/Api/v2/Lookup'
    const endPoint = `${baseURL}/json?input=${req.params.input}`

    bhttp.get(endPoint, {}, (error, response) => {
      if (error) console.log(error)
      res.send(response.body.toString())
    })
  })

  router.get('/quote/:symbol', (req, res) => {
    const { symbol } = req.params
    yFinance.getQuotes(symbol, (error, data) => {
      if (error) console.log(error)
      res.send(data)
    })
  })

  router.get('/search/:symbol', (req, res) => {
    const baseURL = 'http://dev.markitondemand.com/MODApis/Api/v2/Quote'
    const endPoint = `${baseURL}/json?symbol=${req.params.symbol}`

    bhttp.get(endPoint, {}, (error, response) => {
      if (error) console.log(error)
      res.send(response.body.toString())
    })
  })

  router.get('/history/:symbol', (req, res) => {
    const { start, end } = req.query
    const { symbol } = req.params
    yFinance.getHistorical(symbol, start, end, (error, data) => {
      if (error) console.log(error)
      res.status(200).send(data)
    })
  })

  router.get('/watchlist', (req, res) => {
    if (req.session.userID) {
      const { userID } = req.session
      Promise.try(() => {
        return handler.getWatchlist(userID)
      }).then(data => {
        res.status(200).send(data)
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.get('/portfolio', (req, res) => {
    if (req.session.userID) {
      const { userID } = req.session
      Promise.try(() => {
        return handler.getPortfolio(userID)
      }).then(data => {
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
      Promise.try(() => {
        return knex('stocks')
          .where({ company, symbol })
      }).then(data => {
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
      console.log('Buying Symbol...')
      console.log(req.body)
      const { company, symbol } = req.body
      const { userID } = req.session
      Promise.try(() => {
        return knex('stocks')
          .where({ company, symbol })
      }).then(data => {
        if (data.length > 0) {
          const { id } = data[0]
          return Promise.try(() => {
            return handler.buyStock(userID, id, req.body)
          }).then(data => {
            res.status(200).send({
              portfolio: combineStocks(data),
              trades: data
            })
          })
        } else {
          return Promise.try(() => {
            return knex('stocks')
              .returning(['id'])
              .insert({ company, symbol })
          }).then(data => {
            const { id } = data[0]
            return handler.buyStock(userID, id, req.body)
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
      console.log('Selling Symbol...')
      console.log(req.body)
      const { company, symbol } = req.body
      const { userID } = req.session
      Promise.try(() => {
        return knex('stocks')
          .where({ company, symbol })
      }).then(data => {
        if (data.length > 0) {
          const { id } = data[0]
          return Promise.try(() => {
            return handler.sellStock(userID, id, req.body)
          }).then(data => {
            res.status(200).send({
              portfolio: combineStocks(data),
              trades: data
            })
          })
        } else {
          return Promise.try(() => {
            return knex('stocks')
              .returning(['id'])
              .insert({ company, symbol })
          }).then(data => {
            const { id } = data[0]
            return handler.sellStock(userID, id, req.body)
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
