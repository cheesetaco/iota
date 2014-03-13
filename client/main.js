
//ROUTER
CORE.register('router', function(sb) {
	var self 	 = this,
		pathname = location.pathname,

		pathTree;
	
	function req_getBody() {
		var pathList
		if (pathname !== "/")
			pathList = pathTree
		else
			pathList = ["home"]

		sb.dispatch({
			type: 'req/get_body',
			data: pathList
		})
	}
		
	return {
		init : function() {
			pathTree = this.getPathTree()
			req_getBody()
			this.listenPathTree()
		},
		destroy : function() {

		},
		getPathTree : function() {
			pathTree = pathname.split('/');
			pathTree = pathTree.splice(1,pathTree.length); //remove first

			if (pathTree[pathTree.length-1] == "") // if location had a trailing "/"
				pathTree.pop(); 

			return pathTree
		},
		listenPathTree : function() {
			sb.listen({
				"router/path_req": this.dispatchPathTree
			})
		},
		dispatchPathTree : function() {
			sb.dispatch({
				type: "router/path_res",
				data: pathTree
			})
		}
	}
})

CORE.startAll();



