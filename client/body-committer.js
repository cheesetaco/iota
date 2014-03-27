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
				'(:body)model/post' 			: this.postModels,
				'(body:committer)model/post' 	: this.postModels,
				'(sidebar)view/buttons/commit/fired': this.requestModels
			})
		},
		destroy : function() {
			sb.ignore([	
				'(:body)model/post', 
				'(body:committer)model/post', 
				'(sidebar)view/buttons/commit/fired'
			])
		},
		requestModels : function() {
			sb.dispatch('(body:committer)model/get')
			sb.dispatch('(:body)model/get')
		},
		postModels : function(evt) {
			var event = evt.event,
				cache = evt.data;
			
			if (event == '(:body)model/post')
				_master = cache
			else if (event == '(body:committer)model/post')
				_commit = cache

			if (_master && _commit)
			{
				var cacheObj = {
					master : _master,
					commit : _commit
				}
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
			var blocks = sb.dom('#content')[0].children,
				block, blockObj,
				
				cache = [];

			for (var i=0 ; i<blocks.length ; i++) 
			{
				block = blocks[i]

				blockObj = {
					id 		: block.getAttribute('data-id'),
					content : block.innerHTML,
					sort 	: i+1
				}
				cache.push(blockObj)
			}

			sb.dispatch('(body:committer)model/post', cache)
		}

	}
})
CORE.register('body:committer:model/upload', function(sb) {
	return {
		init : function() {
			sb.listen('(body:committer)model/body/versions/post', this.upload)
		},
		destroy : function() {
			sb.ignore('(body:committer)model/body/versions/post')
		},
		upload : function(evt) {
			console.log(evt)
		}
	}
})


