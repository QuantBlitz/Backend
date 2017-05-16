const Promise = require('bluebird')
const WebSocket = require('ws')

const trade = require('../controllers/trade')

const wss = new WebSocket.Server({ port: 443 })

module.exports = (knex) => {
  const handler = trade(knex)

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

    socket.on('message', (data) => {

    })

    socket.on('close', (data) => {
      clearInterval(trades)
    })
  })

  console.log('Websockets server listening on port: 4040')
}
