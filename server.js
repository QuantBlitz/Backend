const config = require('./config.json')
const express = require('express')
const pg = require('pg')
const knex = require('knex')(config.knex)
const path = require('path')
const session = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
// const redis = require('redis')

const port = process.env.PORT || 8080
const env = process.env.NODE_ENV
const app = express()
// const client = redis.createClient()

const { secret } = require('./secret.json')

const staticPath = path.join(__dirname, 'static')

const ws = require('./utils/websockets')(knex)

const profile = require('./routes/profile')(knex)
const stock = require('./routes/stock')(knex)
const trade = require('./routes/trade')(knex)
const user = require('./routes/user')(knex)

const whiteList = [
  'http://localhost:3000',
  'http://162.243.58.89:8080',
  'http://quantblitz.com:8080',
  'http://162.243.58.89:4040',
  'http://quantblitz.com:4040',
  'ws://162.243.58.89:4040',
  'ws://www.quantblitz.com:4040',
  'http://162.243.58.89',
  'http://quantblitz.com'
]

const corsOptionsDelegate = (req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE')
  if (whiteList.indexOf(req.headers.origin) > -1) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
  }
  next()
}

app.use(corsOptionsDelegate)
app.use(helmet())
app.use(bodyParser.json())
app.use(cookieParser())

app.use(session({
  secret,
  name: 'sessionCookieID',
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: new Date(Date.now() + 3600000), // 1 Hour
    maxAge: 3600000
  }
}))

app.use(express.static(staticPath))

// Loading of routes
app.use('/v1/profile', profile)
app.use('/v1/stock', stock)
app.use('/v1/trade', trade)
app.use('/v1/user', user)

// Refresh sessions
app.use('/v1/', (req, res, next) => {
  if (req.session.userID) {
    const { email, username } = req.session
    res.status(200).send({
      user: { email, username }
    })
  } else {
    res.status(401).send()
  }
})

// Server-side rendering for React
if (env === 'production') {
  app.get('*', (req, res) => {
    res.sendFile('index.html', {
      root: staticPath
    })
  })
}

app.listen(port, () => console.log('λ CORS-enabled server on port:', port))
