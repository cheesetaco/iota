var CORE = require('./core.js').CORE,
	fs 	 = require('fs')

CORE.register('utils', function(sb) {
	return {	
		init : function() {
			CORE.start('fileloader')
		},
		destroy : function() {
			CORE.stop('fileloader')
		}
	}
})

CORE.register('fileloader', function(sb) {
	return {
		init : function() {
			sb.listen('(router)file/load', this.loadFile)
		},
		destroy : function() {
			sb.ignore('(router)file/load')
		},
		loadFile : function(evt) {
			var data = evt.data,
				reqObj  = data.reqObj,
				request  = reqObj.req,
				response = reqObj.res,
			
				filePath = data.filePath,
				MIME = data.MIMEtype;

			fs.exists(filePath, function(exists) {
			if (exists) {
			fs.stat(filePath, function(error, stats) {
			fs.open(filePath, "r", function(error, fd) 
			{
				var buffer = new Buffer(stats.size)

				fs.read(fd, buffer, 0, buffer.length, null, function(error, bytesRead, buffer) 
				{
					var data = buffer.toString("utf8", 0, buffer.length)

					
					//////////// http package //////////////
					response.writeHead(200, {'Content-Type': MIME}); //fs load the ajax file
					response.end(data);
					///////////////////////////////////////
					fs.close(fd);							
				})
			})
			})
			}
			})
		}		
	}
})