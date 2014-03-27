


	CORE.register('body:editor/view/selection/rightofCursor', function(sb) {
		var self, selectionObj;

		return {
			init : function() {
				sb.listen({
					'(body:editor)view/selection/toRight/get' : this.returnNodes
				})
			},
			destroy : function() {
				sb.ignore(['(body:editor)view/selection/toRight/get'])
			},
			returnNodes : function(evt) {
				self = evt.self
				selectionObj = evt.data;
				
				var	nodes = self.nodesRightOfCursor(selectionObj)
				selectionObj.nodesToRight = nodes

				sb.dispatch('(body:editor)view/selection/toRight/post', selectionObj)
			},

			nodesRightOfCursor : function(selectionObj) {
				var sel = selectionObj,
					cursorNode 		= sel.cursorNode, 
					cursorPosition 	= sel.cursorPosition, 
					endofNode 		= sel.endofNode, 
					lastTextNode	= sel.lastTextNode,
				//grab the remainder of the paragraph following the cursor
					documentFragment 	= cursorNode.textContent.slice( cursorPosition, endofNode ),
					startSlice 		 	= 0,
					endSlice 			= cursorPosition;
				
				cursorNode.textContent 	= cursorNode.textContent.slice(startSlice, endSlice)

				//additional checks:
				//there are other nodes right of cursor
				if (cursorNode !== lastTextNode)
				{	
					var nextNode 	 = self.checkForSibling(cursorNode)
					documentFragment = self.crawlSiblings(nextNode, documentFragment)
				}

				//hit enter before a whitespace? replace whitespace with non-breaking space
				if (documentFragment.charAt(0) == " ")
					documentFragment = "&nbsp;" + documentFragment.substr(1)
				
				return documentFragment
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
// console.log(nextNode)
				return nextNode
			},			
			crawlSiblings : function(focusNode, documentFragment)
			{
console.log(focusNode)
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



	CORE.register('body:editor/view/selection/cache', function(sb) {

		var	recipient,
			self,
			selectionObj,
			range,
			userSelection, selectionStart, selectionEnd,
			selectionStartNode, selectionEndNode;
	
		return {
			init: function() {
				sb.listen({
					'(body:editor)view/selection/toRight/post' : this.postSelection,
					'(body:editor)view/selection/get' 	: this.determineSelection
				})
			},
			destroy: function() {
				sb.ignore(['(body:editor)view/selection/get'])
			},
			postSelection : function(evt) {
				if (evt && evt.data)
					selectionObj = evt.data
				if (selectionObj) {
					event = '(body:editor)view/selection/post-'+recipient;
console.log(event)
					sb.dispatch(event, selectionObj)
				}
			},

			determineSelection: function(evt) {
				self = evt.self
				//retrieve selection info
				recipient = evt.data

				range = document.createRange()
				userSelection = window.getSelection()
				selectionStart 		= userSelection.baseOffset
				selectionEnd 		= userSelection.extentOffset
				selectionStartNode 	= userSelection.baseNode
				selectionEndNode 	= userSelection.extentNode

				//nothing is selected
				if ( selectionStart === selectionEnd && selectionStartNode === selectionEndNode )
					self.noSelection(self)

			},
			//blinking caret
			noSelection : function(self) {
				var cursorPosition 	= selectionStart,
					cursorNode 		= selectionStartNode,
					endofNode 		= cursorNode.length,
					cursorBlock 	= self.determineParentBlock(cursorNode),
					lastNode 	 	= cursorBlock.childNodes[cursorBlock.childNodes.length-1],
					lastTextNode 	= self.determineChildNode(lastNode),
					endofLastNode;

				if (lastNode.nodeName !== "BR")
					endofLastNode 	= lastTextNode.length;
				else
				{
					endofLastNode 	= 0
					lastTextNode 	= cursorNode
				}
				range.setStart(cursorNode, cursorPosition)
				range.setEnd(cursorNode, endofNode)

				selectionObj = {
					range 			: range,
					userSelection	: userSelection,
					cursorPosition	: cursorPosition,
					cursorNode		: cursorNode,
					endofNode 		: endofNode,
					cursorBlock		: cursorBlock,
					lastTextNode 	: lastTextNode,
					endofLastNode 	: endofLastNode
				}
				if (cursorPosition !== 0 && !(cursorPosition == endofNode && cursorNode === lastTextNode) )//in the middle
					sb.dispatch('(body:editor)view/selection/toRight/get', selectionObj)
				else
					self.postSelection()			
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
			determineChildNode : function(focusNode) {
				if (focusNode.nodeName === "#text")
					return focusNode
				else if (focusNode.nodeName === "SEED")
					return focusNode.childNodes[0]
			} 
		}
	})