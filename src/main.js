import fs from 'fs'
import path from 'path';
import tls from 'tls';
import http from 'http'
import https from 'https'
import httpProxy from 'http-proxy'

import variables from './library/variables.js'
import helper from './library/helper.js'

// proxy
const proxy = httpProxy.createProxyServer({ws: true});
proxy.on('error', (error, req, res) => {
	helper.seeThrow('general proxy error:', {error, headers: req.headers});

	if (res && !res.headersSent) {
		res.writeHead(502, { 'Content-Type': 'text/plain' });
	}

	res?.end?.('Bad gateway: ' + error.message);
});

function respondHttp(req, res){
	const server = helper.getServerByDomain(req.headers.host);
	if (server)
	{
		proxy.web(req, res, {target: server.address}, (error) => {
		    helper.seeThrow('proxy http server error:', {error, headers: req.headers});
		});
	}
	else
	{
	    res.writeHead(502, {'Content-Type': 'text/plain'});
	    res.end('not found');
	}
}
function respondWs(req, socket, head){
	helper.see("client has connected", req.headers.host);

	const server = helper.getServerByDomain(req.headers.host);
	proxy.ws(req, socket, head, {target: server.address}, (error) => {
        helper.seeThrow('proxy ws server error:', {error, headers: req.headers});
    });

	socket.on('close', () => {
		helper.see("client has closed", req.headers.host);
	});
	socket.on('error', (error) => {
		helper.seeThrow("client got error", {error, headers: req.headers});
	});
}

export default {
	setConfig(config){
		if (typeof config.env != "undefined") variables.env = config.env;
		if (typeof config.isDebugging != "undefined") variables.isDebugging = config.isDebugging;
		if (typeof config.servers != "undefined") variables.servers = config.servers;

		return this;
	},
	start(){
		if (variables.env == "prod")
		{
		    /**
		     * done
		     * 
		     * http server
		     * only for redirection
		    */
		    await new Promise((resolve, reject) => {
		        variables.httpServer = http.createServer((req, res) => {
		            let redirectTo = "https://" + req.headers.host + req.url;
		            helper.see("redirecting to " + redirectTo);

					res.writeHead(301, {Location: redirectTo});
					res.end();
		        }).listen(80, () => {
					helper.see("proxy server is running on port 80 (for redirection)");
		            resolve();
		        });
		    });

		    /**
		     * done
		     * 
		     * https and wss server
		    */
		    await new Promise((resolve, reject) => {
		        variables.httpsServer = https.createServer({
		    		SNICallback: (servername, callback) => {
		    			var error = null;
		    			var server = helper.getServerByDomain(servername);
						var ctx = server ? tls.createSecureContext({
		    		        cert: fs.readFileSync(server.sslPath + '/fullchain.pem'),
		    		        key: fs.readFileSync(server.sslPath + '/privkey.pem'),
		    			}) : null;

		    			callback(error, ctx);
		    		},
		        }, respondHttp).listen(443, () => {
		        	helper.see("proxy server is running on port 443");
		    		variables.httpsServer.on('upgrade', respondWs);
		    		resolve();
		        });
		    });
		}
		else
		{
		    /**
		     * done
		     * 
		     * http and ws server
		    */
			await new Promise((resolve, reject) => {
				variables.httpServer = http.createServer(respondHttp).listen(80, () => {
					helper.see("proxy server is running on port 80");
					variables.httpServer.on('upgrade', respondWs);
					resolve();
			    });
			});
		}

		helper.getJoinedDomains().forEach((server) => {
			helper.see(server.address + " <- " + server.domains);
		});
	},
};
