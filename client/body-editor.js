"use strict"

CORE.register('body:editor', function(sb) {
	return {
		init: function() {
			sb.listen({
				'(sidebar)view/buttons/edit/on' : this.create,
				'(sidebar)view/buttons/edit/off': this.destroy
			})
		},
		destroy : function() {
			CORE.stop('body:editor:model/container')
			CORE.stop('body:editor:model/selection/post')
			CORE.stop('body:editor:view/keys/enter')
			CORE.stop('body:editor:view/keys/delete/line')
			CORE.stop('body:editor:view/keys/delete')
			CORE.stop('body:editor:view/keys/arm')
		},
		create : function() {
			CORE.start('body:editor:model/container')
			CORE.start('body:editor:model/selection/post')
			CORE.start('body:editor:view/keys/enter')
			CORE.start('body:editor:view/keys/delete/line')
			CORE.start('body:editor:view/keys/delete')
			CORE.start('body:editor:view/keys')
			
			sb.dispatch('(body:editor)view/loaded')
		}
	}
})

CORE.register('body:editor:model/container', function(sb) {
	var $container

	return {
		init : function() {
			sb.listen({
				'(body:editor)model/container/post' : this.editable,
				'(body:editor)view/loaded' : this.shareContainer
			})
		},
		destroy : function() {
			sb.ignore(['(body:editor)view/loaded', '(body:editor)model/container/post'])
		},
		shareContainer : function() {
			sb.dispatch('(body:editor)model/container/post', sb.dom('#content'))
		},
		editable : function(event) {
			$container = event.data
			$container.attr('contenteditable', true)
		},
		uneditable : function() {
			$container.attr('contenteditable', "false")
		}
	}
})

CORE.register('body:editor:view/keys/arm', function(sb) {
	var self, $container;

	return {
		init : function() {
			sb.listen('(body:editor)model/container/post', this.armKeys)
		},
		destroy : function() {
			sb.ignore(['(body:editor)model/container/post'])
			this.disarmKeys
		},

		armKeys : function(event) {
			self = event.self
			$container = $('#content')

			self.keydown()
			self.keyup()
		},
		disarmKeys : function() {
			$container.off('keydown')
		},

		keysDisabled : false,
		disableKeys : function() {
			$container.on('keypress', function(event) {
				event.preventDefault()
			})
			self.keysDisabled = true
		},
		enableKeys : function() {
			$container.off('keypress')
			self.keysDisabled = false			
		},

		keydown : function() {
			$container.on("keydown", function(event) {
				var key = event.which

				switch (key) {	
				case 13 :
					event.preventDefault()
					sb.dispatch('(body:editor)view/keys/enter')
				break
				case 8 :
					if (!self.keysDisabled)
						self.disableKeys()
				break
				}
			})
		},
		keyup : function() {
			$container.on("keyup", function(event) {
				var key = event.which

				if (key == 8) {
					sb.dispatch('(body:editor)view/keys/delete/blank')
					self.enableKeys()
				}
			})		
		}

	}
})

CORE.register('body:editor:model/selection/post', function(sb) {
	var self, data;
	return {
		init: function() {
			sb.listen({
				'(body:editor)view/keys/enter' : this.getSelection
			})
		},
		destroy: function() {
			sb.ignore(['(body:editor)view/keys/enter'])
		},
		getSelection : function(evt) {
			var s, range
			self 	= evt.self
			s 		= selection.getSelection()
			range 	= document.createRange()
			data 	= {selection: s , range:range}

			if (s.type == "Caret") 
				sb.dispatch('(body:editor)/model/selection/post', data)
			else if (s.type == "Range")
				self.deleteSelection()
		},
		deleteSelection : function() {
			var ham = selection.cutSelection()
			console.log(ham.blocks[0].innerHTML)
		}

	}
})
CORE.register('body:editor:view/keys/enter', function(sb){
	var s, range
	return {
		init : function() {
			sb.listen('(body:editor)model/selection/post', this.newLine)
		},
		destroy  : function() {
			sb.ignore('(body:editor)model/selection/post')
		},
		newLine : function(evt) {
			s = evt.data.selection
			range = evt.data.range

			var	blockEl = s.startBlock,
				node 	= s.startNode,
				lastNode = s.endBlock_lastNode,
				atEndOfBlock = (node === lastNode && s.start === lastNode.length),				

				block = document.createElement("block"),
				documentFragment = "<br>";

			if (s.start == 0) {		
				block.innerHTML = documentFragment
				
				$(s.startBlock).before(block)
				range.setEnd(node, s.start) //recallibrate range to include new block
			}
			else if (atEndOfBlock) {
				block.innerHTML = documentFragment
				
				$(blockEl).after(block)
				range.setEnd(blockEl.nextSibling, 0)
			}
			else { // pressed enter somewhere in the middle of block text
				var newRange, content

				newRange = { endNode : lastNode,
							 end 	 : lastNode.length }

				content = selection.cutSelection(newRange)

				block = content.blocks[0]
				
				$(blockEl).after(block)
				range.setEnd(blockEl.nextSibling, 0)
			}

			range.collapse(false) //send caret to end of range
			s.removeAllRanges()
			s.addRange(range) //select the range				
		}		

	}
})

	CORE.register('body:editor:view/keys/delete', function(sb) {

		return {
			init : function() {
				sb.listen('(body:editor)view/keys/delete/blank', this.checkIsBlankDocument)
			},
			destroy: function() {
				sb.ignore('(body:editor)view/keys/delete')
			},
			checkIsBlankDocument : function (evt) {
				var sel 	= window.getSelection(),
					range 	= document.createRange(),
					cursorNode 	= sel.baseNode,
					container 	= $('#content')[0]

				if (cursorNode == container) {
					var	block 			 = document.createElement('block'),
						documentFragment = "<br>";
					block.innerHTML 	 = documentFragment

					$(container).append(block)
					
					range.setEnd(container.children[0], 0)
					range.collapse(false) //send caret to end of range
					sel.removeAllRanges()//?
					sel.addRange(range) //select the range					
				}
			}

		}	
	})

