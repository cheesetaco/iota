var	CORE = require('./server/core.js').CORE,
	http = require('http');

CORE.register('server', function(sb) {
	var req, res, reqObj

	return {
		init : function() {
			var self = this
			http.createServer(function(request, response) 
			{
				req = request
				res = response
				reqObj = {req:req , res:res}
				
				sb.dispatch('(server)request' , reqObj)

			}).listen(8080)
		},
		destroy : function() {
			//http.stopServer()
		}
	}
})

require('./server/utils.js')
require('./server/router.js')
require('./server/neo.js')
require('./server/sql.js')
require('./server/body-loader.js')
require('./server/body-committer.js')

CORE.start('utils')
CORE.start('router')
CORE.start('neo')
CORE.start('sql')
CORE.start('body:loader')
CORE.start('body:committer')

CORE.start('server')

