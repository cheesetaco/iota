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
			CORE.stop('body:editor/view/editable')
			CORE.stop('body:editor/view/selection/cache')
			CORE.stop('body:editor/view/selection/rightofCursor')
			CORE.stop('body:editor/view/keys/enter')
			CORE.stop('body:editor:view/keys/delete/lineStart')
			CORE.stop('body:editor/view/keys/delete')
			CORE.stop('body:editor/view/keys')
		},
		create : function() {
			CORE.start('body:editor/model/container')
			CORE.start('body:editor/view/editable')
			CORE.start('body:editor/view/selection/cache')
			CORE.start('body:editor/view/selection/rightofCursor')
			CORE.start('body:editor/view/keys/enter')
			CORE.start('body:editor:view/keys/delete/lineStart')
			CORE.start('body:editor/view/keys/delete')
			CORE.start('body:editor/view/keys')
			
			sb.dispatch('(body:editor)view/loaded')
		}
	}
})

CORE.register('body:editor/model/container', function(sb) {

	return {
		init : function() {
			sb.listen({
				'(body:editor)view/loaded' : this.shareContainer
			})
		},
		destroy : function() {
			sb.ignore('(body:editor)view/loaded')
		},
		shareContainer : function() {
			sb.dispatch('(body:editor)model/container/post', sb.dom('#content'))
		}
	}
})
CORE.register('body:editor/view/editable', function(sb) {
	var $container

	return {
		init: function() {
			sb.listen('(body:editor)model/container/post', this.stuff)
		},
		destroy: function() {
			this.unstuff()
			sb.ignore(['(body:editor)model/container/post'])
		},
		stuff : function(event) {
			$container = event.data
			$container.attr('contenteditable', true)
		},
		unstuff : function() {
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
		armKeys : function(event) {
			self = event.self
			$container = $('#content')

			var case8_alreadyDisabled = false
			$container.on("keydown", function(event) {
				var key = event.which

				switch (key)
				{	
					case 13 :
						event.preventDefault()
						sb.dispatch('(body:editor)view/keys/enter')
						break
					case 8 :
						if (!case8_alreadyDisabled)
							self.disableKeys()
						
						case8_alreadyDisabled = true
						
						//check if beginning of line
						var offset = getSelection().baseOffset //takes a bit of processing power

						if(offset == 0)
						{	
							event.preventDefault()
							sb.dispatch('(body:editor)view/keys/delete/lineStart')
						}
						break
				}
			})
			$container.on("keyup", function(event) {
				var key = event.which

				if (key == 8)
				{	
					sb.dispatch('(body:editor)view/keys/delete')
					self.enableKeys()
					case8_alreadyDisabled = false
				}
			})
		},
		disarmKeys : function() {
			$container.off('keydown')
		},
		disableKeys : function() {
			$container.on('keypress', function(event) {
				event.preventDefault()
			})
		},
		enableKeys : function() {
			$container.off('keypress')
		}
	}
})
					
	CORE.register('body:editor:view/keys/delete/lineStart', function(sb) {
		return {
			init : function() {
				sb.listen('(body:editor)view/keys/delete/lineStart', this.requestSelectionObj)
			},
			destroy : function() {
				sb.ignore('(body:editor)view/keys/delete')
			},
			requestSelectionObj : function(evt) {
				var self = evt.self
				sb.dispatch('(body:editor)view/selection/get', 'delete')
			},
			receiveSelectionObj : function(selectionObj) {
				this.moveLineUp(selectionObj)
			},
			moveLineUp : function(selectionObj) {
				//copy selection

				var userSelection 	= selectionObj.userSelection,
					lastNode 		= selectionObj.lastNode,
					endofLastNode	= selectionObj.endofLastNode;	

				userSelection.extend(lastNode, endofLastNode)

				console.log(window.getSelection().toString())
			}
		}
	})
	CORE.register('body:editor/view/keys/delete', function(sb) {

		return {
			init : function() {
				sb.listen({

					'(body:editor)view/keys/delete/lineStart' : this.lineStart
				})
			},
			destroy: function() {
				sb.ignore('(body:editor)view/keys/delete')
			},
			requestSelectionObj : function(event) {
				var self = event.self
				sb.dispatch('(body:editor)view/selection/get', 'delete')
			},
			receiveSelectionObj : function(selectionObj) {
				this.checkIsBlankDocument(selectionObj)
			},
			checkIsBlankDocument : function (selectionObj) {
				console.log(selectionObj)
				var cursorNode 		= selectionObj.cursorNode,
					cursorBlock 	= selectionObj.cursorBlock,
					container = $('#content')[0]

				if (cursorNode == container)
				{
					var range 			= selectionObj.range,
						userSelection	= selectionObj.userSelection,
						block 			= document.createElement('block'),
						documentFragment = "<br>";
					block.innerHTML 	 = documentFragment

					$(container).append(block)
					range.setEnd(container.children[0], 0)
					range.collapse(false) //send caret to end of range
					userSelection.removeAllRanges()//?
					userSelection.addRange(range) //select the range					
				}
			}

		}	
	})
CORE.register('body:editor/view/keys/enter', function(sb) {

	return {
		init: function() {
			sb.listen({
				'(body:editor)view/selection/post-enter' : this.newLine,
				'(body:editor)view/keys/enter' : this.requestSelectionObj
			})
		},
		destroy: function() {
			sb.ignore(['(body:editor)view/keys/enter'])
		},
		requestSelectionObj : function(evt) {
			var self = evt.self
			sb.dispatch('(body:editor)view/selection/cache')
			sb.dispatch('(body:editor)view/selection/get', 'enter')
		},
		newLine : function(evt) {
			var self = evt.self, selectionObj = evt.data, sel = selectionObj,
				range 			= sel.range,
				userSelection 	= sel.userSelection,
				cursorNode		= sel.cursorNode,
				cursorPosition 	= sel.cursorPosition,
				endofNode 		= sel.endofNode,
				cursorBlock 	= sel.cursorBlock,
				lastTextNode 	= sel.lastTextNode,
				block = document.createElement("block"),
				documentFragment;

			if (cursorPosition == 0) {// pressed enter at the beginning of block text
				documentFragment 	= "<br>"
				block.innerHTML 	= documentFragment
				
				$(cursorBlock).before(block)
				range.setEnd(cursorNode, cursorPosition) //recallibrate range to include new block
			}
			else if (cursorPosition == endofNode && cursorNode === lastTextNode) //pressed enter at end of block text
			{
				documentFragment	= "<br>"
				block.innerHTML 	= documentFragment
				
				$(cursorBlock).after(block)
				range.setEnd(cursorBlock.nextSibling, 0)
			}
			else { // pressed enter somewhere in the middle of block text
				sb.listen('(body:editor)view/selection/toRight/post', function(evt) 
				{
					var nodesToRight = evt.data;
					block.innerHTML = nodesToRight;

					$(cursorBlock).after(block)
					range.setEnd(cursorBlock.nextSibling, 0)					
				})
				sb.dispatch('(body:editor)view/selection/toRight/get', selectionObj)
			}
			range.collapse(false) //send caret to end of range
			userSelection.removeAllRanges()
			userSelection.addRange(range) //select the range				
		}

	}
})

