"use strict"

//Body loader
CORE.register('body', function() {
	return {
		init : function() {
			CORE.start('body:model/post')
			CORE.start('body:view/seeds/arm')
			CORE.start('body:view/display')
			CORE.start('body:view/render')
			
			CORE.start('body:model/download')
		},
		destroy: function() {
			CORE.stop('body:model/post')
			CORE.stop('body:view/seeds/arm')
			CORE.stop('body:view/display')
			CORE.stop('body:view/render')
			CORE.stop('body:model/download')			
		}
	}
})


//MODEL
CORE.register('body:model/post', function(sb) {
	var model

	return {
		init : function() {
			sb.listen({
				'(body)request/blocks/done'	: this.cacheResponse_body,
				'(:body)model/get'			: this.globalPost
			})
		},
		destroy : function() {
			sb.ignore(['(body)request/blocks/done'])
		},
		globalPost : function(evt) {
			var returnEvent = '(:body)model/post'+evt.data.event

			sb.dispatch(returnEvent, model)
		},
		cacheResponse_body : function(eventObj) {
			model = eventObj.data;
			var sort = []
			for (var i=0 ; i<model.id.length ; i++)
			{
				sort.push(i+1)
			}
			model.sort = sort
// console.log(model)
			sb.dispatch({
				type: '(body)model/cached',
				data: model
			})
		}

	}
})

CORE.register('body:model/download', function(sb) {

	var pathTree,

	request = function(evtObj) {
		var path = evtObj.data

		$.ajax({
			url: '/?getChildren',
			type: "POST",
			dataType: "json",
			data: JSON.stringify({parentNodes: path}),//send as a Buffer? so node can read it
			success: function(response) {
				sb.dispatch({
					type: '(body)request/blocks/done',
					data: response
				})
			}
		})
	}
	
	return {
		init: function() {
			sb.listen({
				'(body)model/blocks/get' : request
			})
		},
		destroy: function() {
			sb.ignore(['(body)model/blocks/get'])
		}
	}
})


//VIEW
CORE.register('body:view/seeds/arm', function(sb) {
	var $seed, pathTree;

	return {
		init: function() {
			sb.listen({
				'(router)pathTree/cached' 		 : this.getPathTree,
				'(body)view/blocks/displayed'	 : this.armSeeds,
				'(sidebar)view/buttons/edit/on'  : this.disarmSeeds,
				'(sidebar)view/buttons/edit/off' : this.armSeeds
			})
		},
		destroy: function() {
			this.disarmSeeds()
			sb.ignore['(router)pathTree/cached','(body)view/blocks/displayed','view/edit/on','view/edit/off']
		},
		getPathTree: function() {
			pathTree = sb.cache('pathTree')
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
				'(body)view/blocks/rendered' : this.displayBody
			})
		},
		destroy: function() {
			sb.ignore(['(body)view/blocks/rendered'])
		},
		displayBody : function(evtObj) {
			var blocksArray = evtObj.data
			$('#content').append(blocksArray)

			sb.dispatch("(body)view/blocks/displayed")
		}
	}
})
CORE.register('body:view/render', function(sb) {
	var blocksArray = [],
		lastClicked;

	return {
		init : function() {
			sb.listen({
				'(body)model/cached' : this.renderBody
			})
		},
		destroy : function() {
			sb.ignore(['(body)model/cached'])
		},
		renderBody : function(evtObj) {
			var response = evtObj.data,
				content  = response.content,
				id 		 = response.id;

			for (var i=0 ; i<content.length ; i++)
			{
				var temp = "<block data-id='" +id[i]+ "'>" +content[i]+ "</block>"
				blocksArray.push(temp)
			}

			sb.dispatch({
				type: '(body)view/blocks/rendered',
				data: blocksArray
			})
		}

	}
})


