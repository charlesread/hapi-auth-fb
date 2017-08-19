'use strict'

const path = require('path')
const debug = require('debug')('hapi-auth-fb:plugin')
const co = require('bluebird-co').co
const Boom = require('boom')
const type = require('type-detect')

const _options = require(path.join(__dirname, 'lib', 'options.js'))
const utility = require(path.join(__dirname, 'lib', 'utility.js'))

let pluginOptions

const internals = {}

const plugin = function (server, options, next) {
  co(function *() {
    pluginOptions = _options(server, options)
    debug('plugin registered')
    debug('pluginOptions: %j', pluginOptions)
    server.ext('onRequest', function (request, reply) {
      debug('received request for %s [%s]', request.path, request.method)
      reply.continue()
    })
    server.auth.scheme('facebook', internals.scheme)
    if (!server.registrations['yar']) {
      yield server.register({
        register: require('yar'),
        options: pluginOptions.yar
      })
    }
    server.route({
      method: 'get',
      path: pluginOptions.loginPath,
      handler: function (request, reply) {
        reply.redirect(pluginOptions.fb.dialogUrl)
      }
    })
    server.route({
      method: 'get',
      path: pluginOptions.handlerPath,
      handler: function (request, reply) {
        const destination = request.yar.get('destination')
        debug('code: %s', request.query.code)
        debug('destination: %s', destination)
        co(function *() {
          const appAccessToken = yield utility.getAppAccessToken()
          debug('appAccessToken: %s', appAccessToken)
          const userAccessToken = yield utility.getUserAccessToken(request.query.code)
          debug('userAccessToken: %s', userAccessToken)
          const userAccessTokenInfo = yield utility.debugUserAccessToken(userAccessToken, appAccessToken)
          debug('userAccessTokenInfo:')
          debug(userAccessTokenInfo)
          const user_id = userAccessTokenInfo.data.user_id
          let userInfo = yield utility.getUserInfo(userAccessToken, user_id)
          debug('userInfo:')
          debug(userInfo)
          if (type(pluginOptions.transformer) === 'function') {
            const transformerResults = pluginOptions.transformer(userInfo)
            if (transformerResults.then) {
              userInfo = yield transformerResults
            } else {
              userInfo = transformerResults
            }
          }
          request.yar.set(pluginOptions.credentialsName, userInfo)
          reply.redirect(pluginOptions.loginSuccessRedirectPath || destination || '/')
        })
          .catch((err) => {
            if (pluginOptions.error) {
              pluginOptions.error(err)
            } else {
              console.error(err.message)
            }
            reply(Boom.internal())
          })
      }
    })
    next()
  })
    .catch((err) => {
      throw err
    })
}

plugin.attributes = {
  pkg: require('./package.json')
}

internals.scheme = function () {
  const _scheme = {}
  _scheme.authenticate = function (request, reply) {
    try {
      debug('_scheme.authenticate called')
      if (!request.yar.get('destination')) {
        debug('destination is not set, setting to request.path')
        request.yar.set('destination', request.path)
      }
      debug('destination: %s', request.yar.get('destination'))
      const credentials = request.yar.get(pluginOptions.credentialsName)
      if (credentials) {
        if (pluginOptions.success && typeof pluginOptions.success === 'function') {
          pluginOptions.success(credentials)
        }
        debug('credentials does exist')
        reply.continue({credentials})
      } else {
        debug('credentials does not exist, redirecting to FB for auth')
        reply(null, null, {})
          .redirect(pluginOptions.fb.dialogUrl)
      }
    } catch (err) {
      if (pluginOptions.error) {
        pluginOptions.error(err)
      } else {
        console.error(err.message)
      }
    }
  }
  return _scheme
}

module.exports = plugin
