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
			CORE.stop('body:committer/model/documents')
			CORE.stop('body:committer/controller')			
		},
		create : function() {
			CORE.start('body:committer/model/documents')
			CORE.start('body:committer/controller')

		}
	}
})

CORE.register('body:committer/controller', function(sb) {
	return {
		init : function() {
			sb.listen('(sidebar)view/buttons/commit/fired', this.postContainers)
		},
		destroy : function() {
			sb.ignore('(sidebar)view/buttons/commit/fired')
		},
		postContainers : function() {
			sb.listen('(body)model/master/container/post', function(evt) {
			//master container
				sb.dispatch('model/container-master/post', evt.data)
			})
			sb.dispatch('(body)model/master/container/get')
			//commit container	
			sb.dispatch('model/container-commit/post', sb.dom('#content'))
		}
	}
})
CORE.register('body:committer/model/documents', function(sb) {
	var oldDoc, newDoc;

	return {
		init : function() {
			sb.listen({
				'model/container-master/post' : this.processDom,
				'model/container-commit/post' : this.processDom,
				'model/documents/upload' : this.uploadDocuments
			})
		},
		destroy : function() {
			sb.ignore('(sidebar)view/buttons/commit/fired')
		},
		processDom : function(evt) {	
			var blocks = evt.data[0].children,
				block, blockObj,
				
				cache = [];

			for (var i=0 ; i<blocks.length ; i++) 
			{
				block = blocks[i]
				console.dir()
				blockObj = {
					id 		: block.getAttribute('data-id'),
					content : block.innerHTML,
					sort 	: i+1
				}
				cache.push(blockObj)
			}

			if (evt.event == 'model/container-commit/post')
				newDoc = cache
			else if (evt.event == 'model/container-master/post')
				oldDoc = cache

			if (oldDoc && newDoc)
				sb.dispatch('model/documents/upload')
		},
		uploadDocuments : function() {
			console.log(oldDoc)
			console.log(newDoc)

		}

	}

})