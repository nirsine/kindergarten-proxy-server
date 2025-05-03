# kindergarten-proxy-server
An extremely simple and minimalistic reverse proxy server — so intuitive that even a kindergarten kid could use it.
[![MIT licensed][license-image]][license-link]

## What is this?

`kindergarten-proxy-server` is a tiny HTTP reverse proxy server built for maximum simplicity and minimal configuration. Perfect for quick setups, local testing, or lightweight deployments.

## Features

- 🚀 Ridiculously easy to use
- ⚡ Minimal dependencies
- 🔁 Forwards HTTP and WS requests to a target server
- 🔒 Basic logging

## Installation

Install using npm
```bash
$ npm i kindergarten-proxy-server
```

## Usage

```javascript
import kps from 'kindergarten-proxy-server'

const config = {
	env: "prod",
	isDebugging: false,
	servers: [
		{
			name: "my_website_1",
			domain: "mywebsite1.com",
			address: "http://127.0.0.1:81",
			sslPath: "/etc/letsencrypt/live/mywebsite1.com"
		},
		{
			name: "my_website_2",
			domains: [
				"www.mywebsite2.com",
				"app.mywebsite2.com",
				"api.mywebsite2.com",
			],
			address: "http://127.0.0.1:82",
			sslPath: "/etc/letsencrypt/live/mywebsite2.com"
		}
	]
};

kps.setConfig(config).start();
```

## Configuration

### env

```javascript
const config = {
	// for development, this is default value
	env: "dev",

	// for production
	env: "prod",

	...
};
```

`env: "dev"` will open only http server as available protocol
`env: "prod"` will open both http and https server, but **http server is only for redirection to https**, at the end https is the only available protocol, and must define `sslPath`

### isDebugging

```javascript
const config = {
	...

	// for development, this is default value
	isDebugging: true,

	// for production
	isDebugging: false,

	...
};
```

`isDebugging: true` will print all logs on cmd/shell/bash and also store them under directory `/kindergarten-proxy-server-log/`
`isDebugging: false` will not print anything on cmd/shell/bash and will store only error logs under directory `/kindergarten-proxy-server-log/`

### servers

```javascript
const config = {
	...

	servers: [
		// using single domain
		{
			name: "my_website_1",
			domain: "mywebsite1.com",
			address: "http://127.0.0.1:81",
			sslPath: "/etc/letsencrypt/live/mywebsite1.com" // needed when env = "prod"
		},

		// using multiple domains
		{
			name: "my_website_2",
			domains: [
				"www.mywebsite2.com",
				"app.mywebsite2.com",
				"api.mywebsite2.com",
			],
			address: "http://127.0.0.1:82",
			sslPath: "/etc/letsencrypt/live/mywebsite2.com" // needed when env = "prod"
		}
	]
};
```

`domain` is used for defining single domain
`domains` is used for defining multiple domains
`sslPath` is used needed when `env = "prod"`


[//]: # (badges)
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
[license-link]: https://github.com/httprb/http/blob/main/LICENSE.txt
