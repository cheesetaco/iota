//Body loader
CORE.register('module:body-loader', function() {
	return {
		init : function() {
			CORE.start('model/cache')
			CORE.start('view/seeds/arm')
			CORE.start('view/display')
			CORE.start('view/render')
			CORE.start('model/get')
		},
		destroy: function() {
			CORE.stop('model/cache')
			CORE.stop('view/seeds/arm')
			CORE.stop('view/display')
			CORE.stop('view/render')
			CORE.stop('model/get')			

		}
	}
})

//Cache Body
CORE.register('model/cache', function(sb) {

	return {
		init : function() {
			sb.listen({
				'request/body/done' : this.cacheResponse_body
			})
		},
		destroy : function() {
			sb.mute(['request/body/done'])
		},
		cacheResponse_body : function(eventObj) {
			var response = eventObj.data;

			sb.dispatch({
				type: "model/cached",
				data: response
			})
		}

	}
})


//VIEW
CORE.register('view/seeds/arm', function(sb) {
	var pathTree;

	return {
		init: function() {
			sb.listen({
				'view/displayed': this.armSeeds,
				'router/pathTree/cached' : this.cachePathTree
			})
		},
		destroy: function() {
			sb.mute['view/displayed']
		},
		cachePathTree: function() {
			pathTree = sb.cache.pathTree
		},
		armSeeds : function() 
		{
			var	pathSeed, clicked;

			$('seed').on('click', function(event) {
				pathSeed = $(this).attr('name')

				var newPath = pathTree +"/"+ pathSeed;
				window.location.pathname = newPath
			})
		}
	}
})
CORE.register('view/display', function(sb) {

	return {
		init: function() {
			sb.listen({
				'view/rendered' : this.displayBody
			})

			$seed = $('#content block seed');
		},
		destroy: function() {
			sb.mute(['view/rendered'])
		},
		displayBody : function(evtObj) {
			var blocksArray = evtObj.data
			$('#content').append(blocksArray)

			sb.dispatch({
				type : "view/displayed",
				data : null
			})
		}
	}
})
CORE.register('view/render', function(sb) {
	// console.log(sb)
	var blocksArray = [],
		$seed, lastClicked;


	return {
		init : function() {
			sb.listen({
				'model/cached' : this.renderBody
			})
		},
		destroy : function() {
			sb.mute(['model/cached'])
		},
		renderBody : function(evtObj) {
			var response = evtObj.data,
				blocks 	 = response.blocks,
				ids 	 = response.ids;

			for (i=0 ; i<blocks.length ; i++)
			{
				var temp = "<block data-id='" +ids[i]+ "'>" +blocks[i]+ "</block>"
				blocksArray.push(temp)
			}

			sb.dispatch({
				type: 'view/rendered',
				data: blocksArray
			})
		}

	}
})



//MODEL
CORE.register('model/get', function(sb) {

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
					type: 'request/body/done',
					data: response
				})
			}
		})
	}
	return {
		init: function() {
			sb.listen({
				'router/path/cached' : request
			})
		},
		destroy: function() {
			sb.mute(['router/path/cached'])
		}
	}
})