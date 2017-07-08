const Promise = require('bluebird')
const WebSocket = require('ws')

const trade = require('../controllers/trade')

const ws_port = process.env.WS_PORT || 4040

const wss = new WebSocket.Server({ port: ws_port })

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

    socket.on('close', (data) => {
      clearInterval(trades)
    })
  })

  console.log('Websockets server listening on port:', ws_port)
}
