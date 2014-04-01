"use strict"
var	CORE = require('./core.js').CORE;


CORE.register('body:loader', function() {
	return {
		init : function() {
			CORE.start('body:loader:blocks/ids')
			CORE.start('body:loader:response/blocks')
			CORE.start('body:loader:request/blocks')
		},
		destroy : function() {
			CORE.stop('body:loader:blocks/ids')
			CORE.stop('body:loader:response/blocks')
			CORE.stop('body:loader:request/blocks')
		}
	}
})

CORE.register('body:loader:request/blocks', function(sb) {

	return {
		init : function() {
			sb.listen('(body:loader)blocks/get', this.getParentID)
		},
		destroy : function() {
			sb.ignore('(body:loader)blocks/get')
		},
		getParentID : function(evt) {
			var data = evt.data,
				parentNodes = data.parentNodes;

			if (parentNodes && parentNodes.length > 0)
				sb.dispatch('(neo)currentNodeID/get', parentNodes)
		}

	}
})
CORE.register('body:loader:blocks/ids', function(sb) {

	return {
		init : function() {
			sb.listen('(neo)currentNodeID/post', this.getBlocks)
		},
		destroy: function() {
			sb.ignore('(neo)currentNodeID/post')
		},
		getBlocks: function(evt) {
			var currentNodeID = evt.data,
				query = 'match (:object {id:"'+currentNodeID+'"})-[:contains]->(n:block) return n.id order by n.sort';

			sb.dispatch('(neo)query', {query:query , event:'(neo)blocks/ids/post'})
		}
	}
})
CORE.register('body:loader:response/blocks', function(sb) {
	var currentNodeID, neoIdArr;
	return {
		init : function() {
			sb.listen({
				'(neo)currentNodeID/post' 	: this.cacheCurrentNodeID,
				'(neo)blocks/ids/post' 		: this.cacheNeoIDs,
				
				'(sql)blocks/content/post' 	: this.sendBlocks
			})
		},
		destroy : function() {
			sb.ignore('(sql)blocks/content/post')
		},
		cacheCurrentNodeID : function(evt) {
			currentNodeID = evt.data
		},
		cacheNeoIDs : function(evt) {
			neoIdArr = evt.data
		},

		sendBlocks : function(evt) {
			var self = evt.self,
				sqlRows = evt.data.rows,
			
			blocks = self.rearrangeShit(sqlRows),

			packet = {
				content 	: blocks.content,
				id 			: blocks.id,
				parentID 	: currentNodeID
			};

			sb.dispatch('(router)respond', packet);
		},

		rearrangeShit: function(sqlRows) {
			var sqlIdArr = [],
			
			i, id;

			for (i=0 ; i<sqlRows.length ; i++) 
			{
				id = sqlRows[i].id
				sqlIdArr.push(id)
			} 

			var content = [],
				id 		= [],
			
			i, correctlyOrderedID, adjustedIndex, _cont, _id;

			for (i=0 ; i<neoIdArr.length ; i++)
			{
				correctlyOrderedID 	= neoIdArr[i]
				adjustedIndex 		= sqlIdArr.indexOf(correctlyOrderedID)
				
				_cont = sqlRows[adjustedIndex].content
				_id   = sqlRows[adjustedIndex].id

				content.push(_cont)
				id.push(_id)
			}

			return {content: content, id:id}
		}

	}
})