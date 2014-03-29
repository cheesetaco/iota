var	CORE = require('./core.js').CORE;


CORE.register('body:loader', function() {
	return {
		init : function() {
			CORE.start('neo/blockIDs')
			CORE.start('body:loader:response/blocks')
			CORE.start('body:loader:request/blocks')
		},
		destroy : function() {
			CORE.stop('neo/blockIDs')
			CORE.stop('body:loader:response/blocks')
			CORE.stop('body:loader:request/blocks')
		}
	}
})

CORE.register('body:loader:request/blocks', function(sb) {

	return {
		init : function() {
			sb.listen('(router)body/get', this.getBody)
		},
		destroy : function() {
			sb.ignore('(router)body/get')
		},
		getBody : function(evt) {
			var reqObj = evt.data,
				request  = reqObj.req,
				response = reqObj.res;
			response.writeHead(200, {"Content-Type": "text/json"})

			request.on('data', function(data) 
			{
				var jsonObject = JSON.parse(data),
					parentNodes = jsonObject.parentNodes;

				if (parentNodes && parentNodes.length > 0)
				{
					sb.dispatch('neo/currentNodeID/get', parentNodes)
				}
			})			
		}

	}
})
CORE.register('neo/blockIDs', function(sb) {

	return {
		init : function() {
			sb.listen('neo/currentNodeID/post', this.getBlocks)
		},
		destroy: function() {
			sb.ignore('neo/currentNodeID/post')
		},
		getBlocks: function(evt) {
			var currentNodeID = evt.data,
				query = 'match (:object {id:"'+currentNodeID+'"})-[:contains]->(n:block) return n.id order by n.sort';

			sb.dispatch('neo/query', {query:query , event:'neo/blockIDs/post'})
		}
	}
})
CORE.register('body:loader:response/blocks', function(sb) {
	var reqObj, currentNodeID, realIDlist;
	return {
		init : function() {
			sb.listen({
				'(server)request'			: this.cacheReqObj,
				'neo/currentNodeID/post' 	: this.cacheCurrentNodeID,
				'neo/blockIDs/post' 		: this.cacheBlocksIDs,
				'(sql)blocks/content/post' 	: this.sendBlocks
			})
		},
		destroy : function() {
			sb.ignore('(sql)blocks/content/post')
		},
		cacheReqObj : function(evt) {
			reqObj = evt.data
		},
		cacheCurrentNodeID : function(evt) {
			currentNodeID = evt.data
		},
		cacheBlocksIDs : function(evt) {
			realIDlist = evt.data
		},
		sendBlocks : function(evt) {
			var response = reqObj.res,
				rows = evt.data.rows,
				blocksArray = [],
				sqlIDList = [];

			for (i=0;i<rows.length;i++)
			{
				var sqlID = rows[i].id
				sqlIDList.push(sqlID)
			}

			//display in the right order -- fucking sql
			for (j=0;j<realIDlist.length;j++)
			{
				var num = sqlIDList.indexOf(realIDlist[j]),
					realContent = rows[num].content; 
				blocksArray.push(realContent)
			}

			var sendList = JSON.stringify({
				blocks 	: 	blocksArray,
				ids 	: 	realIDlist,
				parentID: 	currentNodeID
			});

			response.end(sendList);			
		}

	}
})