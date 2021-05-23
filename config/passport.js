const db = require('../models')
const User = db.User

const passport = require('passport')
const passportJWT = require('passport-jwt')
const ExtractJwt = passportJWT.ExtractJwt
const JwtStrategy = passportJWT.Strategy

let jwtOptions = {}
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
jwtOptions.secretOrKey = process.env.JWT_SECRET

const strategy = new JwtStrategy(jwtOptions, async (jwt_payload, next) => {
  const user = await User.findByPk(jwt_payload.id)
  if (!user) {
    return next(null, false)
  }
  return next(null, user)
})

passport.use(strategy)
module.exports = passport
