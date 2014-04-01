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
			CORE.stop('body:committer:model/upload')
			CORE.stop('body:committer:model/post')
			CORE.stop('body:committer:start')			
		},
		create : function() {
			CORE.start('body:committer:model/upload')
			CORE.start('body:committer:model/post')
			CORE.start('body:committer:start')

		}
	}
})

CORE.register('body:committer:start', function(sb) {
	var _master, _commit

	return {
		init: function() {
			sb.listen({
				'(:body)model/post[committer]' 	: this.postModels,
				'(body:committer)model/post' 	: this.postModels,
				'(sidebar)view/buttons/commit/fired': this.requestModels
			})
		},
		destroy : function() {
			sb.ignore([	
				'(:body)model/post[committer]', 
				'(body:committer)model/post', 
				'(sidebar)view/buttons/commit/fired'
			])
		},
		requestModels : function() {
			sb.dispatch('(body:committer)model/get')
			sb.dispatch('(:body)model/get', {event:"[committer]"})
		},
		postModels : function(evt) {
			var event = evt.event,
				cache = evt.data;
			
			if (event == '(:body)model/post[committer]')
				_master = cache
			else if (event == '(body:committer)model/post')
				_commit = cache

			if (_master && _commit)
			{

				var cacheObj = {
					master : _master,
					commit : _commit
				}
				_commit = null
				
				sb.dispatch('(body:committer)model/body/versions/post', cacheObj)
			}
		}		
	}
})
CORE.register('body:committer:model/post', function(sb) {

	return {
		init: function() {
			sb.listen('(body:committer)model/get', this.getModel)
		},
		destroy: function() {
			sb.ignore('(body:committer)model/get')
		},
		getModel : function() {
			var model = sb.dom('#content')[0].children,
				block, blockContent, cache, 
				content	= [],
				id 		= [],
				sort 	= [];

			for (var i=0 ; i<model.length ; i++) 
			{
				block = model[i]
				blockContent = block.innerHTML
				
				content.push(blockContent)
				id.push(block.getAttribute('data-id'))
				sort.push(i+1)
			}
			cache = {content:content , id:id , sort:sort}

			sb.dispatch('(body:committer)model/post', cache)
		}

	}
})
CORE.register('body:committer:model/upload', function(sb) {
	
	var request = function(evt) {
		var data = evt.data

		$.ajax({
			url: '/?commitChanges',
			type: "POST",
			dataType: "json",
			data: JSON.stringify(data),//send as a Buffer? so node can read it
			success: function(response) {
				console.log(response)
				// sb.dispatch({
				// 	type: '(body)request/blocks/done',
				// 	data: response
				// })
			}
		})
	}

	return {
		init : function() {
			sb.listen('(body:committer)model/body/versions/post', request)
		},
		destroy : function() {
			sb.ignore('(body:committer)model/body/versions/post')
		}
	}
})


