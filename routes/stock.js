const express = require('express')
const bhttp = require('bhttp')
const Promise = require('bluebird')
const router = express.Router()

module.exports = (knex) => {
  router.get('/input/:input', (req, res) => {
    const baseURL = 'http://dev.markitondemand.com/MODApis/Api/v2/Lookup'
    const endPoint = `${baseURL}/json?input=${req.params.input}`

    bhttp.get(endPoint, {}, (error, response) => {
      if (error) console.log(error)
      res.send(response.body.toString())
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

  router.get('/chart/:symbol', (req, res) => {
    const { symbol } = req.params
    const baseURL = 'http://dev.markitondemand.com/MODApis/Api/v2/InteractiveChart/'
    const endPoint = `${baseURL}json?parameters={"Normalized":false,"NumberOfDays":365,"DataPeriod":"Day","Elements":[{"Symbol":"${symbol}","Type":"price","Params":["c"]}]}`

    bhttp.get(endPoint, {}, (error, response) => {
      if (error) console.log(error)
      res.send(response.body.toString())
    })
  })

  router.get('/watchlist', (req, res) => {
    if (req.session.userID) {
      const { userID } = req.session
      Promise.try(() => {
        return knex('watchlist_stocks')
          .where({
            user_id: userID,
            date_deleted: null
          })
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
        return knex('portfolio_stocks')
          .where({
            user_id: userID,
            date_deleted: null
          })
          .andWhere('shares', '>', '0')
      }).then(data => {
        res.status(200).send(data)
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/watch', (req, res) => {
    if (req.session.userID) {
      const { symbol } = req.body
      const { userID } = req.session
      Promise.try(() => {
        return knex('watchlist_stocks')
          .insert({
            symbol,
            user_id: userID,
          })
      }).then(data => {
        return knex('watchlist_stocks')
          .where({
            user_id: userID,
            date_deleted: null
          })
      }).then(data => {
        res.status(200).send(data)
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/buy', (req, res) => {
    if (req.session.userID) {
      console.log('Buying Symbol...')
      console.log(req.body)
      const { name, shares, symbol, price } = req.body
      const { userID } = req.session
      Promise.try(() => {
        return knex('portfolios')
          .where({
            user_id: userID,
            date_deleted: null
          })
      }).then(data => {
        const { funds } = data[0]
        return Promise.all([
          knex('portfolios')
            .where({ user_id: userID })
            .update({ funds: funds - (+shares * +price) }),
          knex('portfolio_stocks')
            .insert({
              symbol, shares, price,
              user_id: userID,
              company_name: name,
              action: 'BUY'
            }),
          knex('portfolio_stocks')
            .where({
              user_id: userID,
              date_deleted: null
            })
        ])
      }).then(data => {
        const portfolioStocks = data[2]
        res.status(200).send(portfolioStocks)
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/sell', (req, res) => {
    if (req.session.userID) {
      console.log('Selling Symbol...')
      console.log(req.body)
      const { name, shares, symbol, price } = req.body
      const { userID } = req.session
      Promise.try(() => {
        return Promise.all([
          knex('portfolios')
            .where({
              user_id: userID,
              date_deleted: null
            }),
          knex('portfolio_stocks')
            .where({
              symbol,
              user_id: userID,
              action: 'BUY',
              date_deleted: null
            })
        ])
      }).then(data => {
        const { funds } = data[0][0]
        const portfolioShares = data[1][0].shares
        const remainingShares = portfolioShares - shares
        return Promise.all([
          knex('portfolio_stocks')
            .where({
              symbol,
              user_id: userID,
              action: 'BUY'
            })
            .update({
              shares: +remainingShares > 0 ? +remainingShares : 0,
              date_deleted: +remainingShares > 0 ? null : knex.fn.now()
            }),
          knex('portfolios')
            .where({
              user_id: userID,
              date_deleted: null
            })
            .update({
              funds: +funds + (+shares * +price)
            }),
          knex('portfolio_stocks')
            .where({
              user_id: userID,
              date_deleted: null
            })
            .andWhere('shares', '>', '0')
        ])
      }).then(data => {
        const portfolioStocks = data[2]
        res.status(200).send(portfolioStocks)
      })
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  return router
}
