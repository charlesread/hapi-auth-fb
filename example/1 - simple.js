'use strict'

const Hapi = require('hapi')
const hapiAuthFb = require('../index')
// const hapiAuthFb = require('hapi-auth-fb')

const server = Hapi.server({
  host: 'localhost',
  port: 8000
})

!async function () {
  await server.register({
    plugin: hapiAuthFb,
    options: {
      client_id: '315039352290537',
      client_secret: 'b3f451e22629bcfe269ebc52bc8c200f',
      success: function (credentials) {
        console.log(credentials)
      },
      transformer: async function (credentials) {
        credentials.email = credentials.email.toUpperCase()
        return credentials
      }
    }
  })
  server.auth.strategy('facebook', 'facebook')
  await server.route({
    method: 'GET',
    path: '/secure',
    config: {
      auth: 'facebook'
    },
    handler: async function (req, h) {
      // hapi-auth-fb will set req.auth.credentials to that which was returned by Facebook
      const credentials = req.auth.credentials
      return credentials
    }
  })
  await server.route({
    method: 'GET',
    path: '/insecure',
    handler: async function (req, h) {
      return '/insecure'
    }
  })
  await server.start()
}()
  .then(function () {
    console.log('Server running at:', server.info.uri)
  })
  .catch(function (err) {
    console.error(err.message)
    console.error(err.stack)
    process.exit(1)
  })