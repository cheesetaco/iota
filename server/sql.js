var	CORE = require('./core.js').CORE,
	mysql = require('mysql');

CORE.register('sql', function() {
	return {
		init : function() {
			CORE.start('sql/blocks/get')
			CORE.start('sql/query')
		},
		destroy : function() {
			CORE.stop('sql/blocks/get')
			CORE.stop('sql/query')
		}
	}
})
CORE.register('sql/query', function(sb) {
	return {
		init: function() {
			sb.listen('sql/query', this.query)
		},
		destroy : function() {
			sb.ignore('sql/query')
		},
		query : function(evt) {
			var data  = evt.data,
				query = data.query,
				event = data.event,
				data   = data.data,
				connection = mysql.createConnection({
					host     : 'localhost',
					user     : 'rooster',
					password : 'froffles23',
					database : 'iota',
				});

			connection.query(query, function (err, rows, fields) 
			{
				if (err) throw err;
// console.log(" query	| "+query)
// console.log(" result | ...")
// console.log(rows)
// console.log(" 	  ...")

				var obj = {rows:rows, data:data}
				if (rows)
					sb.dispatch(event, obj)

			});
		}

	}
})


CORE.register('sql/blocks/get', function(sb) {
	return {
		init: function() {
			sb.listen('(neo)blocks/ids/post', this.getBlocks)
		},
		destroy : function() {
			sb.ignore('(neo)blocks/ids/post')
		},
		getBlocks : function(evt) {
			var blockIDlist = evt.data,
				length = blockIDlist.length,
				query = 'SELECT * FROM blocks WHERE id in (';
				blockIDorder = [];

			if (length > 1) {
				for (i=0;i<length;i++)
				{
					if (i < length-1)
						query += '"'+blockIDlist[i]+'",'
					else 
						query += '"'+blockIDlist[i]+'")'
				
					blockIDorder.push({"id":blockIDlist[i], "sort": i+1})
				}
			}
			else if (length == 1)
				query = 'SELECT * FROM blocks WHERE id='+'"'+blockIDlist[0]+'"'

			sb.dispatch('sql/query', {query:query , event:'(sql)blocks/content/post'});
		}
	}
})
