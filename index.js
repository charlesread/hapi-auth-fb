'use strict'

const path = require('path')
const debug = require('debug')('hapi-auth-fb:plugin')
const Boom = require('boom')
const type = require('type-detect')

const _options = require(path.join(__dirname, 'lib', 'options.js'))
const utility = require(path.join(__dirname, 'lib', 'utility.js'))

let pluginOptions

const internals = {}

const plugin = {}

plugin.register = async function (server, options) {
  pluginOptions = _options(server, options)
  debug('plugin registered')
  debug('pluginOptions: %j', pluginOptions)
  server.ext('onRequest', function (req, h) {
    debug('received request for %s [%s]', req.path, req.method)
    return h.continue
  })
  server.auth.scheme('facebook', internals.scheme)
  if (!server.registrations['yar']) {
    await server.register({
      plugin: require('yar'),
      options: pluginOptions.yar
    })
  }
  server.route({
    method: 'get',
    path: pluginOptions.loginPath,
    handler: async function (req, h) {
      return h.redirect(pluginOptions.fb.dialogUrl)
    }
  })
  server.route({
    method: 'get',
    path: pluginOptions.handlerPath,
    handler: async function (request, h) {
      try {
        const destination = request.yar.get('destination')
        debug('code: %s', request.query.code)
        debug('destination: %s', destination)
        const appAccessToken = await utility.getAppAccessToken()
        debug('appAccessToken: %s', appAccessToken)
        const userAccessToken = await utility.getUserAccessToken(request.query.code)
        debug('userAccessToken: %s', userAccessToken)
        const userAccessTokenInfo = await utility.debugUserAccessToken(userAccessToken, appAccessToken)
        debug('userAccessTokenInfo:')
        debug(userAccessTokenInfo)
        const user_id = userAccessTokenInfo.data.user_id
        let userInfo = await utility.getUserInfo(userAccessToken, user_id)
        debug('userInfo:')
        debug(userInfo)
        if (type(pluginOptions.transformer) === 'function') {
          debug('transformer exists and is a function')
          const transformerResults = pluginOptions.transformer(userInfo)
          if (transformerResults && transformerResults.then) {
            debug('transformer function is thenable')
            userInfo = await transformerResults
          } else {
            userInfo = transformerResults
          }
        } else {
          debug('transformer does not exist')
        }
        request.yar.set(pluginOptions.credentialsName, userInfo)
        const response = h.response()
        response.redirect(pluginOptions.loginSuccessRedirectPath || destination || '/')
        return response.takeover()
      } catch (err) {
        debug('error encountered in register(): ' + err.message)
        if (type(pluginOptions.error) === 'function') {
          const errorResults = pluginOptions(err)
          if (errorResults && errorResults.then) {
            await pluginOptions.error(err)
          }
        }
        return h.unauthenticated(Boom.internal(err.message))
      }
    }
  })
}

plugin.pkg = require('./package.json')

internals.scheme = function () {
  const _scheme = {}
  _scheme.authenticate = async function (request, h) {
    try {
      debug('_scheme.authenticate called')
      if (!request.yar.get('destination')) {
        debug('destination is not set, setting to request.path')
        request.yar.set('destination', request.path)
      }
      debug('destination: %s', request.yar.get('destination'))
      const credentials = request.yar.get(pluginOptions.credentialsName)
      if (credentials) {
        if (type(pluginOptions.success) === 'function') {
          debug('success exists and is a function')
          const successResults = pluginOptions.success(credentials)
          debug(successResults)
          if (successResults && successResults.then) {
            debug('success function is thenable')
            await successResults
          }
        } else {
          debug('success function does not exist')
        }
        debug('credentials does exist')
        return h.authenticated({credentials})
      } else {
        debug('credentials does not exist, redirecting to FB for auth')
        const response = h.response()
        response.redirect(pluginOptions.fb.dialogUrl)
        return response.takeover()
      }
    } catch (err) {
      debug('error encountered in authenticate(): ' + err.message)
      if (type(pluginOptions.error) === 'function') {
        const errorResults = pluginOptions(err)
        if (errorResults && errorResults.then) {
         await pluginOptions.error(err)
        }
      }
      return h.unauthenticated(err.message)
    }
  }
  return _scheme
}

module.exports = plugin
