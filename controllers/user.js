const argon2 = require('argon2')
const Promise = require('bluebird')

module.exports = (knex) => {
  return {
    createUser: (data) => {
      const { username, password, email } = data
      return Promise.try(() => {
        // 32 byte length salt
        return argon2.generateSalt(32)
      }).then(salt => {
        return argon2.hash(password, salt)
      }).then(hash => {
        return knex('users')
          .returning(['id'])
          .insert({
            email,
            username,
            password_hash: hash
          })
      }).then(data => {
        const { id } = data[0]
        return Promise.all([
          knex('user_settings')
            .returning(['user_id'])
            .insert({ user_id: id }),
          knex('user_details')
            .insert({ user_id: id }),
          knex('portfolios')
            .insert({ user_id: id }),
          knex('watchlists')
            .insert({ user_id: id })
        ])
      })
    },
    loginUser: (data) => {
      const { input, password } = data
      return Promise.try(() => {
        return knex('users')
          .where(
            knex.raw('LOWER(email) = ?', input.toLowerCase())
          )
          .orWhere(
            knex.raw('LOWER(username) = ?', input.toLowerCase())
          )
          .whereNull('date_deleted')
      }).then(data => {
        const { id, username, email, password_hash } = data[0]
        return Promise.all([
          { id, username, email },
          argon2.verify(password_hash, password)
        ])
      })
    },
    usernameExists: (username) => {
      return Promise.try(() =>
        knex('users')
          .where(
            knex.raw('LOWER(username) = ?', username.toLowerCase())
          )
      ).then(data =>
        data
      )
    },
    updatePassword: (userID, passwordNew) => {
      return Promise.try(() => {
        // 32 byte length salt
        return argon2.generateSalt(32)
      }).then(salt => {
        return argon2.hash(passwordNew, salt)
      }).then(hash => {
        return knex('users')
          .where({ id: userID })
          .update({ password_hash: hash })
      })
    },
    updateAccountDetails: (prev, data) => {
      const { email, username } = prev
      return Promise.try(() => {
        return knex('users')
          .returning(['id'])
          .where({ email })
          .orWhere({ username })
          .update({
            email: data.email || email,
            username: data.username || username
          })
      })
    }
  }
}
