'use strict'

const Hapi = require('hapi')
const hapiAuthFb = require('hapi-auth-fb')

const server = Hapi.server({
  host: 'localhost',
  port: 8000
})

!async function () {
  await server.register({
    plugin: hapiAuthFb,
    options: {
      client_id: '',
      client_secret: '',
      success: function (credentials) {
        console.log(credentials)
      },
      transformer: function (credentials) {
        return new Promise((resolve, reject) => {
          credentials.email = credentials.email.toUpperCase()
          return resolve(credentials)
        })
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