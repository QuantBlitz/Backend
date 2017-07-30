const Promise = require('bluebird')
const express = require('express')

const router = express.Router()

const yFinance = require('../utils/yFinance')

const comment = require('../controllers/comment')

module.exports = (knex) => {
  const handler = comment(knex)

  router.get('/:symbol', (req, res) => {
    const { symbol } = req.params
    Promise.try(() =>
      handler.getComments(symbol)
    ).then(data =>
      console.log(data)
    )
  })

  router.post('/create', (req, res) => {
    if (req.session) {
      const { comment, symbol } = req.body
      const { userID } = req.session
      Promise.try(() =>
        knex('stocks')
          .where(
            knex.raw('LOWER(symbol) = ?', symbol.toLowerCase())
          )
      ).then(([data]) => {
        if (data.id) {
          return handler.postComment(userID, data.id, comment)
        } else {

        }
      }).then(data =>
        handler.getComments(symbol)
      ).then(data => {
        console.log(data)
        res.status(200).send(data)
      })
    } else {
      res.status(401).send('Must have user account to comment')
    }
  })

  router.post('/reply', (req, res) => {
    if (req.session) {
      const { commentID, reply } = req.body
      const { userID } = req.session

    } else {
      res.status(401).send('Must have user account to reply')
    }
  })

  return router
}
