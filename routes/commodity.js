const express = require('express')
const router = express.Router()

module.exports = (knex) => {
  router.post('/watch/:commodity', (req, res) => {
    if (req.session.userID) {
      res.send('You are now watching commodity:', req.params.commodity)
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/buy/:commodity', (req, res) => {
    if (req.session.userID) {
      res.send('You have bought commodity:', req.params.commodity)
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.post('/sell/:commodity', (req, res) => {
    if (req.session.userID) {
      res.send('You have sold commodity:', req.params.commodity)
    } else {
      res.status(401).send('Not Authorized')
    }
  })

  router.get('/:commodity', (req, res) => {
    const endPoint = 'To Be Decided'
    res.send('Gold')
  })

  return router
}
