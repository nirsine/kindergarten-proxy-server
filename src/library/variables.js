import config from "../../config.json" with {type: "json"};

export default {
	// identity
	appName: "kindergarten-proxy-server",

	// environment
	env: config.env,
	isDevelopment: config.env == "dev",
	isProduction: config.env == "prod",
	isDebugging: config.isDebugging,

	// servers
	servers: config.servers,
};