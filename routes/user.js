const express = require('express')
const argon2 = require('argon2')
const Promise = require('bluebird')
const user = require('../controllers/user')
const router = express.Router()

module.exports = (knex) => {
  const handler = user(knex)

  router.post('/register', (req, res) => {
    Promise.try(() => {
      return handler.createUser(req.body)
    }).then(data => {
      const { user_id } = data[0][0]
      req.session.userID = user_id
      res.status(200).send({ user: req.body })
    })
  })

  router.post('/login', (req, res) => {
    Promise.try(() => {
      return handler.loginUser(req.body)
    }).spread((user, match) => {
      if (match) {
        req.session.userID = user.id
        req.session.username = user.username
        req.session.email = user.email
        res.status(200).send(user)
      } else {
        req.session.error = 'Access denied'
        res.status(401).send('Incorrect email or password')
      }
    }).catch(error => {
      res.status(401).send('User does not exist')
    })
  })

  router.get('/dashboard', (req, res) => {
    if (req.session.userID) {
      const { userID, email, username } = req.session
      Promise.try(() => {
        return Promise.all([
          knex('user_details').where({ user_id: userID }),
          knex('portfolios').where({ user_id: userID }),
          knex('watchlists').where({ user_id: userID })
        ])
      }).spread((user, portfolio, watchlist) => {
        res.status(200).send({
          user: { email, username },
          portfolio: portfolio[0],
          watchlist: watchlist[0]
        })
      })
    } else {
      res.status(401).send({ message: 'Not Authorized' })
    }
  })

  router.get('/exists/:username', (req, res) => {
    Promise.try(() =>
      handler.usernameExists(req.params.username)
    ).then(data =>
      res.send({
        exists: data.length >= 1 ? true : false
      })
    )
  })

  router.get('/:username', (req, res) => {
    const { username } = req.params
    Promise.try(() =>
      handler.getUser(username)
    ).then(data => {
      console.log(data)
    })
  })

  router.post('/update/:item', (req, res) => {
    if (req.session.userID) {
      const { password, passwordNew } = req.body
      const { userID } = req.session
      Promise.try(() => {
        return knex('users')
          .where({ id: userID })
      }).then(data => {
        const { password_hash } = data[0]
        return argon2.verify(password_hash, password)
      }).then(match => {
        if (match) {
          handler.updatePassword(userID, passwordNew)
          res.status(200).send({ message: 'Password changed' })
        } else {
          res.status(401).send({ message: 'Invalid password' })
        }
      })
    }
  })

  router.post('/details', (req, res) => {
    if (req.session.userID) {
      const { userID } = req.session
      Promise.try(() => {
        return knex('user_details')
          .where({ user_id: userID })
      }).then(data => {
        console.log(data)
      })
    } else {
      res.status(401).send({ message: 'Not Authorized' })
    }
  })

  router.post('/logout', (req, res) => {
    req.session.destroy()
    res.status(200).send({ message: 'Logged Out Successfully' })
  })

  return router
}
