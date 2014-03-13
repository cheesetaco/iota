
//ROUTER
CORE.register('router/pathTree/cacher', function(sb) {
	var pathTree,
		pathname = location.pathname;


	return {
		init: function() {
			pathTree = this.getPathTree()
		},
		destroy: function() {

		},
		getPathTree : function() {
			pathTree = pathname.split('/');
			pathTree = pathTree.splice(1,pathTree.length); //remove first

			if (pathTree[pathTree.length-1] == "") // if location had a trailing "/"
				pathTree.pop(); 

			this.cachePathTree();

			return pathTree
		},
		cachePathTree : function() {
			sb.cacher({
				name : 'pathTree',
				data : pathTree
			})

			sb.dispatch({
				type: 'router/pathTree/cached',
				data: null
			})
		}
	}
})

CORE.register('router', function(sb) {
	var self 	 = this,
		pathname = location.pathname,
		pathTree;

		
	return {
		init : function() {
			sb.listen({
				"router/pathTree/cached" : this.pathCatalyst
			})
		},
		destroy : function() {
			sb.mute(['router/path/req'])
		},
		pathCatalyst : function() {
			var pathList;
			pathTree = sb.cache.pathTree

			if (pathname !== "/")
				pathList = pathTree
			else
				pathList = ["home"]

			sb.dispatch({
				type: 'router/path/cached',
				data: pathList
			})
		}
		
	}
})

CORE.start('module:body-loader')
CORE.start('router');
CORE.start('router/pathTree/cacher')




