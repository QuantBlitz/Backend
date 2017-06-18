const Promise = require('bluebird')
const express = require('express')
const router = express.Router()

const profile = require('../controllers/profile')

module.exports = (knex) => {
  const handler = profile(knex)

  router.get('/:username', (req, res) => {
    const { username } = req.params
    Promise.try(() =>
      handler.getUserTrades(username)
    ).then(data => {
      res.status(200).send(data)
    })
  })

  return router
}
