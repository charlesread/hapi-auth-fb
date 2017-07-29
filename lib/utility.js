'use strict'

const path = require('path')
const request = require('request')
const debug = require('debug')('hapi-auth-fb:options')

const _options = require(path.join(__dirname, 'options.js'))

module.exports = {

  getAppAccessToken() {
    return new Promise((resolve, reject) => {
      request({
        url: _options().fb.graphUrl + '/oauth/access_token',
        method: 'get',
        qs: {
          client_id: _options().client_id,
          client_secret: _options().client_secret,
          grant_type: 'client_credentials'
        }
      }, function (err, response, body) {
        if (err) {
          return reject(err)
        }
        body = JSON.parse(body)
        resolve(body.access_token)
      })
    })
  },

  getUserAccessToken(code) {
    debug('getUserAccessToken called')
    debug('code: %s', code)
    debug('url: %s', _options().fb.graphUrl + '/oauth/access_token')
    debug('redirect_uri: %s', `${_options().appUrl}${_options().handlerPath}`)
    return new Promise((resolve, reject) => {
      request({
        url: _options().fb.graphUrl + '/oauth/access_token',
        method: 'get',
        qs: {
          client_id: _options().client_id,
          client_secret: _options().client_secret,
          code,
          redirect_uri: `${_options().appUrl}${_options().handlerPath}`
        }
      }, function (err, response, body) {
        if (err) {
          return reject(err)
        }
        debug('body: %j', body)
        body = JSON.parse(body)
        resolve(body.access_token)
      })
    })
  },

  debugUserAccessToken(input_token, access_token) {
    return new Promise((resolve, reject) => {
      request({
        url: _options().fb.graphUrl + '/debug_token',
        method: 'get',
        qs: {
          input_token,
          access_token
        }
      }, function (err, response, body) {
        if (err) {
          return reject(err)
        }
        body = JSON.parse(body)
        resolve(body)
      })
    })
  },

  getUserInfo(access_token, user_id) {
    return new Promise((resolve, reject) => {
      request({
        url: _options().fb.graphUrl + '/' + user_id,
        method: 'get',
        qs: {
          access_token,
          fields: _options().fields
        }
      }, function (err, response, body) {
        if (err) {
          return reject(err)
        }
        body = JSON.parse(body)
        resolve(body)
      })
    })
  }
}