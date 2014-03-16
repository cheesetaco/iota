"use strict"

//ROUTER
CORE.register('router', function(sb) {

	return {
		init: function() {
			CORE.start('router:pathTree/cache')
		},
		destroy: function() {
			CORE.stop('router:pathTree/share');
		}

	}
})

CORE.register('router:pathTree/cache', function(sb) {
	var pathname = location.pathname, 
		pathTree

	return {
		init: function() {
			pathTree = this.getPathTree()
			sb.cache('pathTree', pathTree)
			this.requestBlocks()
			sb.dispatch('(router)pathTree/cached')

		},
		destroy: function() {
			sb.cache('pathTree', " ")
		},
		getPathTree : function() {

			pathTree = pathname.split('/')
			pathTree = pathTree.splice(1,pathTree.length); //remove first
			if (pathTree[pathTree.length-1] == "") // if location had a trailing "/"
				pathTree.pop(); 

			return pathTree
		},
		requestBlocks : function() {
			if (pathname == "/")
				sb.dispatch('(body)model/blocks/get', ["home"])
			else
				sb.dispatch('(body)model/blocks/get', pathTree)			
		}
	}
})





