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
			CORE.stop('body:editor/view/selection')
			CORE.stop('body:editor/view/keys/enter')
			CORE.stop('body:editor/view/keys/delete')
			CORE.stop('body:editor/view/keys')
		},
		create : function() {
			CORE.start('body:editor/model/container')
			CORE.start('body:editor/view/editable')
			CORE.start('body:editor/view/selection')
			CORE.start('body:editor/view/keys/enter')
			CORE.start('body:editor/view/keys/delete')
			CORE.start('body:editor/view/keys')
			
			sb.dispatch('editor/view/loaded')
		}
	}
})

CORE.register('body:editor/model/container', function(sb) {

	return {
		init : function() {
			sb.listen({
				'editor/view/loaded' : this.shareContainer,
				'(body)model/master/container/get' : this.globalDispatch
			})
		},
		destroy : function() {
			sb.ignore('editor/view/loaded')
		},
		shareContainer : function() {
			sb.dispatch('model/container/post', sb.dom('#content'))
		},
		globalDispatch : function() {
			sb.dispatch('(body)model/master/container/post', sb.dom('#content'))
		}
	}
})
CORE.register('body:editor/view/editable', function(sb) {
	var $container

	return {
		init: function() {
			sb.listen('model/container/post', this.stuff)
		},
		destroy: function() {
			console.log('destroyed')
			this.unstuff()
			sb.ignore(['model/container/post'])
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
			sb.listen('model/container/post', this.armKeys)
		},
		destroy : function() {
			sb.ignore(['model/container/post'])
			this.disarmKeys
		},
		armKeys : function(event) {
			self = event.self
			$container = $('#content')
			$container.on("keydown", function(event) {
				var key = event.which
				switch (key)
				{	
					case 13 :
						event.preventDefault()
						sb.dispatch('editor/view/keys/enter')
						break
					case 8 :
						self.disableKeys()
						break

					// 	break
					//other hotkeys

					// default :
						// console.log(key)
				}
			})
			$container.on("keyup", function(event) {
				var key = event.which

				if (key == 8)
				{	
					sb.dispatch('editor/view/keys/delete')
					self.enableKeys()
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

	CORE.register('body:editor/view/keys/delete', function(sb) {

		return {
			init : function() {
				sb.listen('editor/view/keys/delete', this.sendRequest)
			},
			destroy: function() {
				sb.ignore('editor/view/keys/delete')
			},
			sendRequest : function(event) {
				var self = event.self
				sb.dispatch('editor/view/selection/get', self)
			},
			receiveSelectionObj : function(selectionObj) {
				this.checkIsBlankDocument(selectionObj)
			},
			checkIsBlankDocument : function (selectionObj) {
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
				sb.listen('editor/view/keys/enter', this.requestSelectionObj)
			},
			destroy: function() {
				sb.ignore(['editor/view/keys/enter'])
			},
			requestSelectionObj : function(evt) {
				var self = evt.self
				sb.dispatch('editor/view/selection/get', self)
			},
			receiveSelectionObj : function(selectionObj) {
				this.newLine(selectionObj)
			},
			newLine : function(selectionObj) {
				var range 			= selectionObj.range,
					userSelection 	= selectionObj.userSelection,
					cursorNode		= selectionObj.cursorNode,
					cursorPosition 	= selectionObj.cursorPosition,
					endofNode 		= selectionObj.endofNode,
					cursorBlock 	= selectionObj.cursorBlock,
					block 			= document.createElement("block"),
					documentFragment,
				//...>placeholder if divert : text is selected delete

					nextNode 	= this.checkForSibling(cursorNode);

				if (cursorPosition == 0) // pressed enter at the beginning of block text
				{
					documentFragment 	= "<br>"
					block.innerHTML 	= documentFragment
					
					$(cursorBlock).before(block)
					range.setEnd(cursorNode, cursorPosition) //recallibrate range to include new block
				}
				else if (cursorPosition == endofNode && nextNode === undefined) //pressed enter at end of block text
				{
					documentFragment	= "<br>"
					block.innerHTML 	= documentFragment
					
					$(cursorBlock).after(block)
					range.setEnd(cursorBlock.nextSibling, 0)
				}
				else // pressed enter somewhere in the middle of block text
				{
					documentFragment = this.getTextRightOfCursor(cursorNode, cursorPosition, endofNode)
					block.innerHTML = documentFragment;

					$(cursorBlock).after(block)
					range.setEnd(cursorBlock.nextSibling, 0)					
				}
				range.collapse(false) //send caret to end of range
				userSelection.removeAllRanges()
				userSelection.addRange(range) //select the range				
			},
			checkForSibling : function(cursorNode) {
				var parentNode = cursorNode.parentNode.nodeName,
					nextNode

				if (parentNode == 'BLOCK') 
				{	
					if (cursorNode.nextSibling !== null)
						nextNode = cursorNode.nextSibling
				}
				else if (parentNode == 'SEED')
				{	
					if (cursorNode.parentNode.nextSibling !== null)
						nextNode = cursorNode.parentNode.nextSibling
				}

				return nextNode
			},
			getTextRightOfCursor : function(cursorNode, cursorPosition, endofNode) {
				//grab the remainder of the paragraph following the cursor
				var	documentFragment 	= cursorNode.textContent.slice( cursorPosition, endofNode ),
					startSlice 		 	= 0,
					endSlice 			= cursorPosition;
				
				cursorNode.textContent 	= cursorNode.textContent.slice(startSlice, endSlice)

				//additional checks:
				//are there other text nodes and/or seeds in the block
				var nextNode = this.checkForSibling(cursorNode);
				//yes? crawl siblings
				if (nextNode !== undefined)
					documentFragment = this.crawlSiblings(nextNode, documentFragment)

				//hit enter before a whitespace? replace whitespace with non-breaking space
				if (documentFragment.charAt(0) == " ")
					documentFragment = "&nbsp;" + documentFragment.substr(1)
				
				return documentFragment
			},
			crawlSiblings : function(focusNode, documentFragment)
			{
				var workingFragment = documentFragment
				var hasSibling = true;

				while(hasSibling)
				{
					hasSibling = false;

					//grab the html from the sibling, also remove those contents from the previous paragraph
					if (focusNode.nodeName == "SEED")
					{
						workingFragment += focusNode.outerHTML
						focusNode.parentNode.removeChild(focusNode) 
					}
					else if (focusNode.nodeName == "#text")
					{
						workingFragment += focusNode.textContent
						focusNode.parentNode.removeChild(focusNode)						
					}

					//is there another sibling?
					if (focusNode.nextSibling)
					{
						focusNode = focusNode.nextSibling;
						hasSibling = true
					}

				}			
				
				//send the final contents back to be injected
				return workingFragment;					
			}

		}
	})

	CORE.register('body:editor/view/selection', function(sb) {

		var	self,
			selectionObj,
			range,
			userSelection, selectionStart, selectionEnd,
			selectionStartNode, selectionEndNode;
	
		return {
			init: function() {
				sb.listen('editor/view/selection/get', this.giveSelectionObj)
			},
			destroy: function() {
				sb.ignore(['editor/view/selection/get'])
			},
			giveSelectionObj : function(event) {
				var caller = event.data
				self = event.self

				self.determineSelection(self)

				caller.receiveSelectionObj(selectionObj)
			},
			determineSelection: function(self) {

				//retrieve selection info
				range = document.createRange()
				userSelection = window.getSelection()
				selectionStart = userSelection.baseOffset
				selectionEnd = userSelection.extentOffset
				selectionStartNode = userSelection.baseNode
				selectionEndNode = userSelection.extentNode

				//nothing is selected
				if ( selectionStart === selectionEnd && 
					 selectionStartNode === selectionEndNode )
				{
					//define selectionObj
					self.noSelection()					
				}
			},
			//blinking caret
			noSelection : function() {
				var cursorPosition 	= selectionStart,
					cursorNode 		= selectionStartNode,
					endofNode		= cursorNode.length,
					cursorBlock 	= self.determineParentBlock(cursorNode);

				range.setStart(cursorNode, cursorPosition)
				range.setEnd(cursorNode, endofNode)

				selectionObj = {
					range 			: range,
					userSelection	: userSelection,
					cursorPosition	: cursorPosition,
					cursorNode		: cursorNode,
					endofNode 		: endofNode,
					cursorBlock		: cursorBlock
				}
			},
			determineParentBlock : function(cursorNode) {
				var cursorBlock

				if (cursorNode.parentNode.nodeName == "BLOCK")
					cursorBlock = cursorNode.parentNode

				else if (cursorNode.nodeName == "BLOCK")
					cursorBlock = cursorNode

				else if (cursorNode.parentNode.nodeName == "SEED")
					cursorBlock = cursorNode.parentNode.parentNode
				

				return cursorBlock
			},
		}
	})