"use strict"

//Body loader
CORE.register('body', function() {
	return {
		init : function() {
			CORE.start('body:model/cache')
			CORE.start('body:view/seeds/arm')
			CORE.start('body:view/display')
			CORE.start('body:view/render')
			CORE.start('body:model/get')
		},
		destroy: function() {
			CORE.stop('body:model/cache')
			CORE.stop('body:view/seeds/arm')
			CORE.stop('body:view/display')
			CORE.stop('body:view/render')
			CORE.stop('body:model/get')			

		}
	}
})

//Cache Body
CORE.register('body:model/cache', function(sb) {

	return {
		init : function() {
			sb.listen({
				'request/blocks/done' : this.cacheResponse_body
			})
		},
		destroy : function() {
			sb.ignore(['request/blocks/done'])
		},
		cacheResponse_body : function(eventObj) {
			var response = eventObj.data;

			sb.dispatch({
				type: "model/blocks/cached",
				data: response
			})
		}

	}
})


//VIEW
CORE.register('body:view/seeds/arm', function(sb) {
	var $seed, pathTree;

	return {
		init: function() {
			sb.listen({
				'(router)pathTree/cached' : this.cachePathTree,
				'view/blocks/displayed'		: this.armSeeds,
				'(sidebar)view/buttons/edit/on' : this.disarmSeeds,
				'(sidebar)view/buttons/edit/off' : this.armSeeds
			})
		},
		destroy: function() {
			sb.ignore['(router)pathTree/cached','view/blocks/displayed','view/edit/on','view/edit/off']
			this.disarmSeeds()
		},
		cachePathTree: function() {
			pathTree = sb.cache.pathTree
		},
		armSeeds : function() 
		{
			var	pathSeed; 
			$seed = $('seed')

			$seed.on('click', function(event) {
				pathSeed = $(this).attr('name')

				var newPath = pathTree +"/"+ pathSeed;
				window.location.pathname = newPath
			})
		},
		disarmSeeds : function() {
			$seed.off('click')
		}
	}
})
CORE.register('body:view/display', function(sb) {
	return {
		init: function() {
			sb.listen({
				'view/blocks/rendered' : this.displayBody
			})
		},
		destroy: function() {
			sb.ignore(['view/blocks/rendered'])
		},
		displayBody : function(evtObj) {
			var blocksArray = evtObj.data
			$('#content').append(blocksArray)

			sb.dispatch("view/blocks/displayed")
		}
	}
})
CORE.register('body:view/render', function(sb) {
	// console.log(sb)
	var blocksArray = [],
		lastClicked;


	return {
		init : function() {
			sb.listen({
				'model/blocks/cached' : this.renderBody
			})
		},
		destroy : function() {
			sb.ignore(['model/blocks/cached'])
		},
		renderBody : function(evtObj) {
			var response = evtObj.data,
				blocks 	 = response.blocks,
				ids 	 = response.ids;

			for (var i=0 ; i<blocks.length ; i++)
			{
				var temp = "<block data-id='" +ids[i]+ "'>" +blocks[i]+ "</block>"
				blocksArray.push(temp)
			}

			sb.dispatch({
				type: 'view/blocks/rendered',
				data: blocksArray
			})
		}

	}
})



//MODEL
CORE.register('body:model/get', function(sb) {

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
					type: 'request/blocks/done',
					data: response
				})
			}
		})
	}
	return {
		init: function() {
			sb.listen({
				'(router)path/cached' : request
			})
		},
		destroy: function() {
			sb.ignore(['(router)path/cached'])
		}
	}
})