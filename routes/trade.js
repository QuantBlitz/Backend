const express = require('express')
const Promise = require('bluebird')
const trade = require('../controllers/trade')
const router = express.Router()

module.exports = (knex) => {
  const handler = trade(knex)

  router.get('/latest', (req, res) => {
    Promise.try(() =>
      handler.getLatestTrades()
    ).then(data =>
      res.send({ trades: data })
    )
  })

  return router
}
