const Promise = require('bluebird')
const WebSocket = require('ws')

const stock = require('../controllers/trade')

const wss = new WebSocket.Server({ port: 4040 })

module.exports = (knex) => {
  const handler = stock(knex)

  wss.on('connection', (socket) => {
    Promise.try(() =>
      handler.getLatestTrades()
    ).then(data =>
      socket.send(JSON.stringify(data))
    )

    const trades = setInterval(() => {
      Promise.try(() =>
        handler.getLatestTrades()
      ).then(data =>
        socket.send(JSON.stringify(data))
      )
    }, 1000)

    socket.on('open', (data) => {

    })

    socket.on('message', (data) => {

    })

    socket.on('close', (data) => {
      clearInterval(trades)
    })
  })

  console.log('Websockets server listening on port: 4040')
}
