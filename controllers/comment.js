const Promise = require('bluebird')

const commentColumns = [
  'root',
  'parents.id',
  'user_id',
  'parents.child',
  'symbol',
  'content'
]

module.exports = (knex) => {
  return {
    postComment: (userID, stockID, comment) => {
      return Promise.try(() =>
        knex('comments')
          .returning(['id'])
          .insert({
            user_id: userID,
            content: comment
          })
      ).then(([ comment ]) =>
        knex('parents')
          .insert({
            stock: stockID,
            child: comment.id
          })
      )
    },
    getComments: (symbol) => {
      return Promise.try(() =>
        knex('parents')
          .select(commentColumns)
          .where({ symbol })
          .joinRaw(
           `LEFT JOIN stocks on stock = stocks.id
            LEFT JOIN comments on child = comments.id
            LEFT JOIN children on root = stocks.id`
          )
          .orderBy('id', 'desc')
          .limit(20)
      )
    }
  }
}
