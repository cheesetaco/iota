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
			CORE.stop('body:editor/model/container')
			CORE.stop('body:editor/view/keys/enter')
			CORE.stop('body:editor/view/keys/delete/line')
			CORE.stop('body:editor/view/keys/delete/blank')
			CORE.stop('body:editor/view/keys')
		},
		create : function() {
			CORE.start('body:editor/model/container')
			CORE.start('body:editor/view/keys/enter')
			CORE.start('body:editor/view/keys/delete/line')
			CORE.start('body:editor/view/keys/delete/blank')
			CORE.start('body:editor/view/keys')
			
			sb.dispatch('(body:editor)view/loaded')
		}
	}
})

CORE.register('body:editor/model/container', function(sb) {
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

CORE.register('body:editor/view/keys', function(sb) {
	var self, $container;

	return {
		init : function() {
			sb.listen('(body:editor)model/container/post', this.armKeys)
		},
		destroy : function() {
			sb.ignore(['(body:editor)model/container/post'])
			this.disarmKeys
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
		
		armKeys : function(event) {
			self = event.self
			$container = $('#content')

			var keysDisabled = false

			$container.on("keydown", function(event) {
				var key = event.which

				switch (key) {	
				case 13 :
					event.preventDefault()
					sb.dispatch('(body:editor)view/keys/enter')
				break
				case 8 :
					if (!self.keysDisabled) {
						self.disableKeys()
						console.log('diablo')
					}
					//check if beginning of line
					// if(getSelection().baseOffset == 0) {//takes a bit of processing power
						// event.preventDefault()
						// sb.dispatch('(body:editor)view/keys/delete/line')
					// }
				break
				}
			})
			$container.on("keyup", function(event) {
				var key = event.which

				if (key == 8) {
					sb.dispatch('(body:editor)view/keys/delete/blank')
					self.enableKeys()
				}
			})

			var myElement = document.getElementById('content');
			myElement.onpaste = function(e) {
				e.preventDefault()
				console.log( e.clipboardData.getData('text/plain') )
			}

		},
		disarmKeys : function() {
			$container.off('keydown')
		}

	}
})

CORE.register('body:editor/view/keys/enter', function(sb) {
	var self, s, range;
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
			self 	= evt.self
			s 		= selection.getSelection()
			range 	= document.createRange()

			if (s.type == "Caret") 
				self.newLine()
			else if (s.type == "Range")
				self.deleteSelection()
		},
		deleteSelection : function() {
			var ham = selection.cutSelection()
			console.log(ham.blocks[0].innerHTML)
		},
		newLine : function(evt) {
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

				newRange = {
					endNode : lastNode,
					end : lastNode.length
				}
				content = selection.cutSelection(newRange)
console.log(content)

				block = content.blocks[0]
				
				$(blockEl).after(block)
				range.setEnd(blockEl.nextSibling, 0)
			}

			range.collapse(false) //send caret to end of range
			s.removeAllRanges()
			s.addRange(range) //select the range				
		},
		getContent : function(lastNode) {

			return content
		}

	}
})

					
	CORE.register('body:editor/view/keys/delete/line', function(sb) {
		var self, selectionObj;

		return {
			init : function() {
				sb.listen({
					'(body:editor)view/selection/post-delete'	: this.deleteLine,
					'(body:editor)view/keys/delete/line'		: this.requestSelectionObj
				})
			},
			destroy : function() {
				sb.ignore(['(body:editor)view/keys/delete/line'])
			},
			requestSelectionObj : function(evt) {
				self = evt.self
				sb.dispatch('(body:editor)view/selection/get', 'delete')
			},
			deleteLine : function(evt) {
				console.log(evt.data)

			}
		}
	})

	CORE.register('body:editor/view/keys/delete/blank', function(sb) {

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
					console.log('hi')
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


