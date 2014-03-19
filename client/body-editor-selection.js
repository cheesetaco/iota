	CORE.register('body:editor/view/selection/rightofCursor', function(sb) {
		var self;

		return {
			init : function() {
				sb.listen({
					'(body:editor)view/selection/toRight/get' : this.returnNodes,
				})
			},
			destroy : function() {
				sb.ignore(['(body:editor)view/selection/toRight/get'])
			},
			returnNodes : function(evt) {
				var	selectionObj, nodes;
				
				self = evt.self
				selectionObj = evt.data
				nodes = self.nodesRightOfCursor(selectionObj)

				sb.dispatch('(body:editor)view/selection/toRight/post', nodes)
			},
			nodesRightOfCursor : function(selectionObj) {
				var cursorNode 		= selectionObj.cursorNode, 
					cursorPosition 	= selectionObj.cursorPosition, 
					endofNode 		= selectionObj.endofNode, 
					lastTextNode	= selectionObj.lastTextNode,
				//grab the remainder of the paragraph following the cursor
					documentFragment 	= cursorNode.textContent.slice( cursorPosition, endofNode ),
					startSlice 		 	= 0,
					endSlice 			= cursorPosition;
				
				cursorNode.textContent 	= cursorNode.textContent.slice(startSlice, endSlice)

				//additional checks:
				//there are other nodes right of cursor
				if (cursorNode !== lastTextNode)
				{	
					var nextNode = self.checkForSibling(cursorNode)
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
				console.log(nextNode)
				return nextNode
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



	CORE.register('body:editor/view/selection/cache', function(sb) {

		var	self,
			selectionObj,
			range,
			userSelection, selectionStart, selectionEnd,
			selectionStartNode, selectionEndNode;
	
		return {
			init: function() {
				sb.listen({
					'(body:editor)view/selection/cache' : this.determineSelection,
					'(body:editor)view/selection/get' : this.postSelection
				})
			},
			destroy: function() {
				sb.ignore(['(body:editor)view/selection/get'])
			},
			postSelection : function(evt) {
				if (selectionObj)
				{	
					var recipient = evt.data,
					event = '(body:editor)view/selection/post-'+recipient;
				
				console.log(event)
				sb.dispatch(event, selectionObj)
				}
			},
			determineSelection: function(evt) {
				self = evt.self,
				selectionObj,
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
					selectionObj = self.noSelection(self)					
				}
			},
			//blinking caret
			noSelection : function(self) {
				var cursorPosition 	= selectionStart,
					cursorNode 		= selectionStartNode,
					endofNode		= cursorNode.length,
					cursorBlock 	= self.determineParentBlock(cursorNode),
					lastNode 	 	= cursorBlock.childNodes[cursorBlock.childNodes.length-1],
					lastTextNode 	= self.determineChildNode(lastNode),
					endofLastNode

				if (lastNode.nodeName !== "BR")
					endofLastNode 	= lastTextNode.length;
				else
				{
					endofLastNode 	= 0
					lastTextNode 	= cursorNode
				}
				range.setStart(cursorNode, cursorPosition)
				range.setEnd(lastTextNode, endofLastNode)

				return {
					range 			: range,
					userSelection	: userSelection,
					cursorPosition	: cursorPosition,
					cursorNode		: cursorNode,
					endofNode 		: endofNode,
					cursorBlock		: cursorBlock,
					lastTextNode 	: lastTextNode,
					endofLastNode 	: endofLastNode
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
			determineChildNode : function(focusNode) {
				if (focusNode.nodeName === "#text")
					return focusNode
				else if (focusNode.nodeName === "SEED")
					return focusNode.childNodes[0]
			} 
		}
	})