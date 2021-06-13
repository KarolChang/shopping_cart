const express = require('express')
const exphbs = require('express-handlebars')
const session = require('express-session')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const flash = require('connect-flash')
const MemoryStore = require('memorystore')(session)
const passport = require('passport')
const cors = require('cors')

// .env
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const app = express()
const PORT = process.env.PORT || 3000

// set cors
app.use(cors())

// set view engine
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs',
  helpers: require('./config/hbs-helpers')
}))
app.set('view engine', 'hbs')

// set bodyParser
app.use(bodyParser.urlencoded({ extended: true }))

// set methodOverride
app.use(methodOverride('_method'))

// set session
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 86400000 },
  store: new MemoryStore({
    checkPeriod: 86400000 // 24h
  })
}))

// set connect-flash
app.use(flash())

// put token in req.headers
app.use((req, res, next) => {
  console.log('**token***', req.session.token)
  if (req.session.token) {
    req.headers.authorization = `Bearer ${req.session.token}`
    return next()
  }
  return next()
})

// flash message
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg')
  res.locals.warning_msg = req.flash('warning_msg')
  res.locals.danger_msg = req.flash('danger_msg')
  return next()
})

// use passport
app.use(passport.initialize())
app.use(passport.session())

// require routes
require('./routes')(app)

// error handling
app.use((err, req, res, next) => {
  if (err) {
    res.status(500)
    console.log('500 error: ', err)
    return res.render('error', { err })
  }
})

app.listen(PORT, () => {
  console.log(`Express app is running on localhost:${PORT}`)
})
