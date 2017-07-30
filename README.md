# hapi-auth-fb

Hapi JS plugin that allows "plug-and-play" Facebook authentication in Hapi routes.  

<strong>NOTE</strong>:  This README assumes that you know the basics of Facebook's OAuth 2 implementation.  Perhaps I'll add a bit of a tutorial later, but for now there are many tutorials out there about how to set up a basic Facebook <strong>web</strong> app, it's not hard, basically you need to:

* Set up a Facebook app in their developer portal
* Get your `client id` and `client secret` from the Facebook development portal once you set up your app.
* Give Facebook the domain of your app (you _can_ use `localhost` in during development.
* Give Facebook the URL of your application.

`hapi-auth-fb` is a typical auth strategy/scheme hapi plugin, meaning that once a user is logged-in their credentials are available in all secured routes via the `request.auth.credentials` object, so you can do _anything_ with that information.  Here's the basic flow when a user requests an endpoint that is secured:

1.  The plugin sees if the user is already authenticated, if they are, they go right to the requested route (with `request.auth.credentials` fully set, BTW).
2. If the user has not already authenticated the user will be redirected to a Facebook login page, once they log in they will be asked if they give you app permission to use the things that you're asking for (see the `scope` option in the options section below).  If they authorize you're app they will be redirected back to the originally requested route in your app.
3. The originally requested route will now have full access, through the `request.auth.credentials` object, to all of the `fields` that you requested access to (see the `fields` option in the options section below).  Simple as that.

## Installation

```bash
npm install --save hapi-auth-fb
```

## Usage

```js
'use strict'

const Hapi = require('hapi')

const plugins = [
  {
    register: require('hapi-auth-fb'),
    options: {
      client_id: '',
      client_secret: '',
      success: function (credentials) {
        console.log(credentials)
      }
    }
  }
]

const server = new Hapi.Server()

server.connection({
  host: 'localhost',
  port: 8000
})

server.register(plugins, function (err) {
  if (err) {
    throw err
  }
  server.auth.strategy('facebook', 'facebook')

  // an insecure route
  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      return reply('Welcome to the app! Check out <a href="/secure">/secure</a> to see a secured endpoint.')
    }
  })

  // a secure route, will redirect to FB for auth
  server.route({
    method: 'GET',
    path: '/secure',
    config: {
      auth: 'facebook'
    },
    handler: function (request, reply) {
      const credentials = request.auth.credentials
      return reply(`Hi, ${credentials.first_name}!  Your email address is ${credentials.email} (according to Facebook).`)
    }
  })

  server.start((err) => {
    if (err) {
      throw err
    }
    console.log('Server running at:', server.info.uri)
  })
})
```

## Options

## Required Options

The only "it won't work without them" options are `client_id` and `client_secret`.

## Optional Options

* `fields` - a string of comma-separated strings that tells the Facebook API what fields to give you about a user once they are authenticated.  By default `fields` is `first_name,last_name,short_name,email,id`.  <strong>These fields become `request.auth.credentials` in your routes.</strong>  `hapi-auth-fb` hits Facebook's `User` API endpoint once authenticated, so the available fields are listed in the `User` API's [documentation](https://developers.facebook.com/docs/graph-api/reference/user).
* `scope` - a string of comma-separated strings that represent the permissions that you're asking the user for.  `public_profile,email` by default, see Facebook's [permissions reference](https://developers.facebook.com/docs/facebook-login/permissions) for all available options.
* `version` - a string that determines which version of Facebook's API you want to use, `2.10` by default.
* `success` - a function with the signature `function(object)` (where `object` is the information that you requested in `fields`.  This function is called upon successful authentication with Facebook, so this is useful for things like persisting user information, it does not have any impact on the plugin itself, it's meant for your purposes.
* `handlerPath` - a string that is the endpoint that Facebook redirects to after successful authentication.  A user will be immediately redirected to the originally requested endpoint, so at most a user might see this URL for a few milliseconds, changing it is merely a cosmetic concern. By default it's a random string.
* `yar` - an object that is passed to [`yar`](https://github.com/hapijs/yar) (the plugin that `hapi-auth-fb` uses for session management. See [https://github.com/charlesread/hapi-auth-fb/blob/master/lib/options.js](https://github.com/charlesread/hapi-auth-fb/blob/master/lib/options.js) for defaults.  Be careful.

