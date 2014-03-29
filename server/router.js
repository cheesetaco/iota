var	CORE = require('./core.js').CORE,
	mime = require('mime');

CORE.register('router', function(sb) {

	return {
		init : function() {
			sb.listen('(server)request', this.route)
		},
		destroy : function() {
			sb.ignore('(server)request')
		},
		route : function(evt) {
			var reqObj = evt.data,
				request  = reqObj.req,
				response = reqObj.res,

				
				location = request.url,
				MIMEtype = mime.lookup(location),
				getChildren 	= location.match(/\/\?getChildren\??.*/),
				commitChanges 	= location.match(/\/\?commitChanges/);


			if (MIMEtype !== "application/javascript") 
			{
				console.log("	location 	|	" +location)
				console.log("	type     	|	" +MIMEtype)
				console.log("")
			}

			if (getChildren) 
			{	
				sb.dispatch('(router)body/get', reqObj)
			}
			else if (commitChanges) 
			{	
				sb.dispatch('(router)body/update', reqObj)
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
		}
	
	}
})
