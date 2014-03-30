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
	var currentNodeID, neoIDs;
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
			neoIDs = evt.data
		},

		sendBlocks : function(evt) {
			var sqlRows = evt.data.rows,

			send = {
				content : 	[],
				id 		: 	[],
				parentID: 	currentNodeID
			},
			neoContent,
			sqlID, sqlContent, num, i;

			for (i=0 ; i<sqlRows.length ; i++)
			{
				sqlID = sqlRows[i].id
				send.id.push(sqlID)
			}
			//display in the right order -- fucking sql
			for (i=0 ; i<neoIDs.length ; i++)
			{
				neoContent 	= neoIDs[i]
				num 		= send.id.indexOf(neoContent)
				sqlContent 	= sqlRows[num].content 
				
				send.content.push(sqlContent)
			}

			sb.dispatch('(router)respond', send);
		}

	}
})