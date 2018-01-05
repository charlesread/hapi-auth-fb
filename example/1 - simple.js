'use strict'

const Hapi = require('hapi')
const hapiAuthFb = require('../index')

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


// 'use strict'
//
// const Hapi = require('hapi')
//
// const plugins = [
//   {
//     register: require('../index'),
//     options: {
//       client_id: '',
//       client_secret: '',
//       success: function (credentials) {
//         console.log(credentials)
//       },
//       transformer: function (credentials) {
//         return new Promise((resolve, reject) => {
//           credentials.email = credentials.email.toUpperCase()
//           return resolve(credentials)
//         })
//       }
//     }
//   }
// ]
//
// const server = new Hapi.Server()
//
// server.connection({
//   host: 'localhost',
//   port: 8000
// })
//
// server.register(plugins, function (err) {
//   if (err) {
//     throw err
//   }
//   server.auth.strategy('facebook', 'facebook')
//
//   // an insecure route
//   server.route({
//     method: 'GET',
//     path: '/',
//     handler: function (request, reply) {
//       return reply('Welcome to the app! Check out <a href="/secure">/secure</a> to see a secured endpoint.')
//     }
//   })
//
//   // a secure route, will redirect to FB for auth
//   server.route({
//     method: 'GET',
//     path: '/secure',
//     config: {
//       auth: 'facebook'
//     },
//     handler: function (request, reply) {
//       const credentials = request.auth.credentials
//       return reply(`Hi, ${credentials.first_name}!  Your email address is ${credentials.email} (according to Facebook).`)
//     }
//   })
//
//   server.start((err) => {
//     if (err) {
//       throw err
//     }
//     console.log('Server running at:', server.info.uri)
//   })
// })