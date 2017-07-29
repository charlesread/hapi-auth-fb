'use strict'

const path = require('path')
const deepExtend = require('deep-extend')
const randomize = require('randomatic')

let _options

module.exports = function (server, options) {
  if (_options) {
    return _options
  }
  let defaultOptions
  defaultOptions = {
    client_id: '',
    client_secret: '',
    fields: 'first_name,last_name,short_name,email,id,birthday',
    scope: 'public_profile,email',
    handlerPath: '/fbhandler',
    credentialsName: randomize('Aa', 10),
    yar: {
      name: randomize('Aa', 10),
      storeBlank: false,
      cookieOptions: {
        password: randomize('*', 256),
        isSecure: server.info.protocol === 'https',
        isHttpOnly: true,
        isSameSite: 'Lax'
      }
    },
    appUrl: server.info.uri
  }
  _options = deepExtend({}, defaultOptions, options)
  _options.fb = {
    graphUrl: 'https://graph.facebook.com/v2.10',
    dialogUrl: `https://www.facebook.com/v2.10/dialog/oauth?client_id=${_options.client_id}&redirect_uri=${server.info.uri}${_options.handlerPath}&scope=${_options.scope}`
  }
  return _options
}