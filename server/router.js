var	CORE = require('./core.js').CORE,
	mime = require('mime');

CORE.register('router', function(sb) {
	var self, reqObj, request, response, 
		location, MIMEtype,
		getChildren, commitChanges;

	return {
		init : function() {
			sb.listen({
				'(server)request' : this.define,
				'(router)respond' : this.respond
			})
		},
		destroy : function() {
			sb.ignore('(server)request')
		},
		define : function(evt) {
			self = evt.self

			reqObj = evt.data
			request  = reqObj.req
			response = reqObj.res
			
			location = request.url
			MIMEtype = mime.lookup(location)
			getChildren 	= location.match(/\/\?getChildren\??.*/)
			commitChanges 	= location.match(/\/\?commitChanges/)

			self.router()
		},
		router : function() {
			if (MIMEtype !== "application/javascript") 
			{
				console.log("	location 	|	" +location)
				console.log("	type     	|	" +MIMEtype)
				console.log("")
			}

			if (getChildren) 
			{	
				this.request('(body:loader)blocks/get')
			}
			else if (commitChanges) 
			{	
				this.request('(router)blocks/commit')
			}
			else if (MIMEtype == "application/javascript")
			{
				var filePath = "." + location,
					data = {	reqObj	 : reqObj,
								filePath : filePath, 
								MIMEtype : MIMEtype	}

				sb.dispatch('(router)file/load', data)
			}
			else {
				var data = {	reqObj	 : reqObj,
								filePath : "index.html",
								MIMEtype : "text/html"	}

				sb.dispatch('(router)file/load', data)
			}
		},
		request : function(event) {
			response.writeHead(200, {"Content-Type": "text/json"})

			request.on('data', function(data) {
				data = JSON.parse(data)
				sb.dispatch(event, data)
			})
		},
		respond : function(evt) {
			var data = JSON.stringify(evt.data)
			response.end(data)
		}
	
	}
})

