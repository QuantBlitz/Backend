const config = require('./config.json')
const express = require('express')
const pg = require('pg')
const knex = require('knex')(config.knex)
const path = require('path')
const cors = require('cors')
const session = require('express-session')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
// const redis = require('redis')

const port = process.env.PORT
const env = process.env.NODE_ENV
const app = express()
// const client = redis.createClient()

const { secret } = require('./secret.json')

const staticPath = path.join(__dirname, 'static')

const currency = require('./routes/currency')(knex)
const stock = require('./routes/stock')(knex)
const user = require('./routes/user')(knex)

const whiteList = ['http://162.243.58.89', 'http://quantblitz.com']

const corsOptionsDelegate = (req, callback) => {
  if (whiteList.indexOf(req.header('Origin')) !== -1) {
    callback(null, { orgin: true }) // Enable requested origin in CORS response
  } else {
    callback(null, { origin: false }) // Disable CORS for this request
  }
}

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', 'OPTIONS,GET,PUT,POST,DELETE')
  if (env === 'development') {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  } else {
    if (whiteList.indexOf(req.headers.origin) > -1) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
    }
    // res.header('Access-Control-Allow-Origin', 'http://162.243.58.89')
    // res.header('Access-Control-Allow-Origin', 'http://quantblitz.com')
  }
  next()
}

// app.use(cors(corsOptionsDelegate))
app.use(allowCrossDomain)
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
app.use('/v1/currency', currency)
app.use('/v1/stock', stock)
app.use('/v1/user', user)

// Refresh sessions
app.use('/v1/', (req, res, next) => {
  if (req.session.userID) {
    res.status(200).send()
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

app.listen(port || 8080, () => console.log('λ CORS-enabled server'))
