var	CORE = require('./core.js').CORE,
	neo4j = require('node-neo4j');

CORE.register('neo', function() {
	return {
		init : function() {
			CORE.start('neo/currentNodeID')
			CORE.start('neo/query')
		},
		destroy : function() {
			CORE.stop('neo/currentNodeID')
			CORE.stop('neo/query')
		}
	}
})

CORE.register('neo/query', function(sb) {

	return {
		init : function() {
			sb.listen('neo/query', this.query)
		},
		destroy : function() {
			sb.ignore('neo/query')
		},
		query : function(evt) {
			var query = evt.data.query,
				event = evt.data.event,
				db = new neo4j('http://kylerutland:froffles23@localhost:7474')

			db.cypherQuery(query, function(err, result) 
			{
				if(err) throw err;
console.log(" query	|  "+query)
console.log(" result	|  "+result.data)
console.log(" ")

				if (result.data[0]!==undefined)
					sb.dispatch(event, result.data)
				// else
				// 	display404Page();
			})			
		}
	}
})


CORE.register('neo/currentNodeID', function(sb) {
	return {
		init : function() {
			sb.listen('neo/currentNodeID/get', this.currentNodeID)
		},
		destroy : function() {
			sb.ignore('neo/currentNodeID/get')
		},
		currentNodeID : function(evt) {
			var parentNodes = evt.data,
				length = parentNodes.length,
				query = "match ";

			for (i=0; i<length; i++)
			{
				if (i<length-1)
				{
					var phrase = "({name:'"+parentNodes[i]+"'})-[:owns]->";
					query += phrase
				}
				else {
					var phrase = "(currentNode {name:'"+parentNodes[i]+"'}) return currentNode.id";
					query += phrase
				}
			}

			sb.dispatch('neo/query', { query:query , event:'neo/currentNodeID/post'})
		}
	}
})
