"use strict"

CORE.register("body:committer", function(sb) {

	return {
		init : function() {
			sb.listen({
				'(sidebar)view/buttons/edit/on' : this.create,
				'(sidebar)view/buttons/edit/off': this.destroy
			})
		},
		destroy : function() {
			CORE.stop('view/committer/documents/cache')
		},
		create : function() {
			CORE.start('view/committer/documents/cache')
		}
	}
})

CORE.register('view/committer/documents/cache', function(sb) {
	var oldDoc, newDoc;

	return {
		init : function() {
			sb.listen({
				'(body)view/master/cached' 			 : this.cacheOld,
				'(sidebar)view/buttons/commit/fired' : this.cacheNew
			})
		},
		destroy : function() {
			sb.ignore('(sidebar)view/buttons/commit/fired')
		},
		cacheOld : function(evt) {
			var blocks = evt.data[0].children,

				
			for (var i=0 ; i<blocks.length ; i++) 
			{
				console.log(blocks[i])
			}
		},
		cacheNew : function() {
			newDoc = sb.dom('#content')[0].children

			console.log(oldDoc)
			console.log(newDoc)
		}
	}

})