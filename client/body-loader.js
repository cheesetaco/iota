//Body loader

//Cache Body
CORE.register('model_cache', function(sb) {

	return {
		init : function() {
			sb.listen({
				'res/get_body' : this.cacheResponse_body
			})
		},
		destroy : function() {
			sb.mute(['res/get_body'])
		},
		cacheResponse_body : function(eventObj) {
			var response = eventObj.data;

			sb.dispatch({
				type: "cached/body",
				data: response
			})
		}

	}
})


//VIEW
CORE.register('view_get_body', function(sb) {
	// console.log(sb)
	var blocksArray = [],
		$seed, lastClicked, pathTree,

	cachePath = function(evtObj) {
		pathTree = evtObj.data
	},
	armSeeds = function() {
		var pathSeed, clicked;

		$('seed').on('click', function(event) {
			pathSeed = $(this).attr('name')

			var newPath = pathTree +"/"+ pathSeed;
			window.location.pathname = newPath
		})
	},
	displayBody = function() {
		sb.dom('#content').append(blocksArray)

		$seed = sb.dom('#content block seed');

		chubbs.requestPath()

		armSeeds()
	},
	renderBody = function(evtObj) {
		var response = evtObj.data,
			blocks 	 = response.blocks,
			ids 	 = response.ids;

		for (i=0 ; i<blocks.length ; i++)
		{
			var temp = "<block data-id='" +ids[i]+ "'>" +blocks[i]+ "</block>"
			blocksArray.push(temp)
		}

		displayBody(blocksArray)
	};


	var chubbs = {
		init : function() {
			this.requestPath()

			sb.listen({
				'cached/body' : renderBody
			})
		},
		destroy : function() {
			sb.mute(['cached/body'])
		},
		requestPath : function() {
			sb.listen({
				"router/path_res": cachePath
			})
			sb.dispatch({
				type: "router/path_req",
				data: null
			})
		}

	}
	return chubbs
})


//MODEL
CORE.register('model_get_body', function(sb) {

	var paths,

	request = function(eventObj) {
		paths = eventObj.data;

		$.ajax({
			url: '/?getChildren',
			type: "POST",
			dataType: "json",
			data: JSON.stringify({parentNodes: paths}),//send as a Buffer? so node can read it
			success: function(response) {
				sb.dispatch({
					type: 'res/get_body',
					data: response
				})
			}
		})
	}
	return {
		init: function() {
			sb.listen({
				'req/get_body' : request
			})
		},
		destroy: function() {
			sb.mute(['req/get_body'])
		}
	}
})