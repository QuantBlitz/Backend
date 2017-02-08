const express = require('express')
const bhttp = require('bhttp')
const router = express.Router()

module.exports = (knex) => {
  router.post('/watch/:symbol', (req, res) => {
    if (req.session.userID) {
      res.send('You are now watching:', req.params.symbol)
    } else {
      res.status(401).send('Not authorized')
    }
  })

  router.post('/buy/:symbol', (req, res) => {
    if (req.session.userID) {
      res.send('You just bought:', req.params.symbol)
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/sell/:symbol', (req, res) => {
    if (req.session.userID) {
      res.send('You just sold:', req.params.symbol)
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.get('/:symbol', (req, res) => {
    const endPoint = `http://api.fixer.io/latest?base=${req.params.symbol}`

    bhttp.get(endPoint, {}, (error, response) => {
      if (error) console.log(error)
      res.send(response.body.toString())
    })
  })

  return router
}
