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
			CORE.stop('body:view/editor/start')
			CORE.stop('body:view/editor/selection')
			CORE.stop('body:view/editor/keys/enter')
			CORE.stop('body:view/editor/keys')
		},
		create : function() {
			CORE.start('body:view/editor/start')
			CORE.start('body:view/editor/selection')
			CORE.start('body:view/editor/keys/enter')
			CORE.start('body:view/editor/keys')
			
			sb.dispatch('view/editor/loaded')
		}
	}
})

CORE.register('body:view/editor/start', function(sb) {
	var $container

	return {
		init: function() {
			sb.listen({
				'(body)view/master/cached' : this.stuff,
				'view/editor/loaded': function() {
					sb.dispatch('(body)view/master/cached', sb.dom('#content'))
				}
			})

		},
		destroy: function() {
			sb.ignore(['(body)view/master/cached','body'])
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
CORE.register('body:view/editor/keys', function(sb) {
	var $container;

	return {
		init : function() {
			sb.listen('(body)view/master/cached', this.armKeys)
		},
		destroy : function() {
			sb.ignore(['(body)view/master/cached'])
			this.disarmKeys
		},
		armKeys : function(event) {
			$container = $('#content')
			$container.on("keydown", function(event) {
				var key = event.which

				switch (key)
				{	
					case 13 :
						sb.dispatch('view/editor/keys/enter/press')
						break
					// default :
					// 	console.log("nah")
				}
			})
		},
		disarmKeys : function() {
			$container.off('keydown')
		}
	}
})
	CORE.register('body:view/editor/keys/enter', function(sb) {
		var selectionObj;

		return {
			init: function() {
				sb.listen({
					'view/editor/selection/post'	: this.newLine,
					'view/editor/keys/enter/press' 	: function() {
						sb.dispatch('view/editor/selection/get')
					}
				})
			},
			destroy: function() {
				sb.ignore(["view/editor/selection/post", 'view/editor/selection/get'])
			},
			newLine : function(evtObj) {
				selectionObj = evtObj.data

				console.log(selectionObj)
			}

		}
	})
	CORE.register('body:view/editor/selection', function(sb) {

		var	selectionObj,
			block, 
			range,
			userSelection, selectionStart, selectionEnd,
			selectionStartNode, selectionEndNode,
			cursorPosition;

	
		return {
			init: function() {
				sb.listen({
					'view/editor/loaded' : this.define,					
					'view/editor/selection/get' : this.postSelectionObj
				})
			},
			destroy: function() {
				sb.ignore(['view/editor/selection/get','view/buttons/edit/on'])
			},
			define : function() {
				block = document.createElement("block")
				range = document.createRange()
			},			
			postSelectionObj : function(event) {
				self = event.asker

				selectionObj = self.selection(self)

				sb.dispatch('view/editor/selection/post', selectionObj)
			},
			selection: function(self) {

				//retrieve selection info
				userSelection = window.getSelection()
				selectionStart = userSelection.baseOffset
				selectionEnd = userSelection.extentOffset
				selectionStartNode = userSelection.baseNode
				selectionEndNode = userSelection.extentNode

				//nothing is selected
				if ( selectionStart === selectionEnd && 
					 selectionStartNode === selectionEndNode )
				{
					return self.noSelection()					
				}
			},
			//blinking caret
			noSelection : function() {
				var cursorPosition, cursorNode, endofNode;

				cursorNode = selectionStartNode
				cursorPosition = selectionStart
				endofNode = cursorNode.length

				range.setStart(cursorNode, cursorPosition)
				range.setEnd(cursorNode, endofNode)

				return {
					selectionStart  : selectionStart,
					cursorNode		: cursorNode

				}
			}
		}
	})



