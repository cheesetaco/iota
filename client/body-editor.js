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
			CORE.stop('body:view/editor/selection')
			CORE.stop('body:view/editor/keys/enter')
			CORE.stop('body:view/editor/keys')
			CORE.stop('body:view/editor/on')
		},
		create : function() {
			CORE.start('body:view/editor/selection')
			CORE.start('body:view/editor/keys/enter')
			CORE.start('body:view/editor/keys')
			CORE.start('body:view/editor/on')
		}
	}
})

CORE.register('body:view/editor/on', function(sb) {
	var $content_container = sb.dom('#content');

	return {
		init: function() {
			$content_container.attr('contenteditable', true)
			sb.dispatch('view/editor/on')
		},
		destroy: function() {
			$content_container.attr('contenteditable', "false")
			sb.dispatch('view/editor/off')
		},
		body_checkifEmpty : function() {

		},

	}
})
CORE.register('body:view/editor/keys', function(sb) {
	var $content_container = $('#content');

	return {
		init : function() {
			sb.listen({
				'view/editor/on' : this.armKeys,
				'view/editor/off' : this.disarmKeys
			})
		},
		destroy : function() {
			sb.ignore(['view/editor/on','view/editor/off'])
		},
		armKeys : function() {
			$content_container.on("keydown", function(event) {
				var key = event.which

				switch (key)
				{	
					case 13 :
						sb.dispatch('view/editor/keys/enter')
						break
					// default :
					// 	console.log("nah")
				}
				

			})
		}
	}
})
	CORE.register('body:view/editor/keys/enter', function(sb) {
		var $content_container = $('#content')


		return {
			init: function() {
				sb.listen({
					'view/editor/selection/post' : this.newline,
					'view/editor/keys/enter' : this.getSelectionObj
				})
			},
			destroy: function() {
				sb.ignore(["view/editor/keys/enter", 'view/editor/selection/post'])
			},
			getSelectionObj : function(evt) {
				sb.dispatch('view/editor/selection/get')
			},
			newLine : function() {
				console.log('ham')
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
					'view/editor/on' : this.define,					
					'view/editor/selection/get' : this.getSelection
				})
			},
			destroy: function() {
				sb.ignore(['view/editor/selection/get','view/buttons/edit/on'])
			},
			define : function() {
				block = document.createElement("block")
				range = document.createRange()
			},			
			shareSelectionObject : function() {
				sb.dispatch({
					type : 'view/editor/selection/post',
					data : selectionObj
				})
			},
			getSelection: function(event) {
				var self = event.caller;

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
					self.noSelection()					
				}

				selectionObj = {

				}
				// self.shareSelectionObject()
			},
			//blinking caret
			noSelection : function() {
				var cursorPosition, cursorNode, endofNode;

				cursorNode = selectionStartNode
				cursorPosition = selectionStart
				endofNode = cursorNode.length

				range.setStart(cursorNode, cursorPosition)
				range.setEnd(cursorNode, endofNode)
			}
		}
	})



