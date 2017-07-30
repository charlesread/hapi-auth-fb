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
    fields: 'first_name,last_name,short_name,email,id',
    scope: 'public_profile,email',
    version: '2.10',
    handlerPath: '/' + randomize('Aa', 10),
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
    graphUrl: `https://graph.facebook.com/v${_options.version}`,
    dialogUrl: `https://www.facebook.com/v${_options.version}/dialog/oauth?client_id=${_options.client_id}&redirect_uri=${server.info.uri}${_options.handlerPath}&scope=${_options.scope}`
  }
  return _options
}