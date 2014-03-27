// get selection and its contents, 
// if cursor : return content in block to right
// if selection : return content in selection
"use strict"
var selection = (function() {

	return {
		//----------------API------------------//

		getSelection : function(optRange) {
			var sel = this.constructSelection(optRange)
			return sel
		},
		getContent : function(optRange) {
			var s, range
			
			if (optRange) 
				s = this.getSelection(optRange)
			else 
				s = this.getSelection()
			
			range = this.constructRangeFromSelection(s)

			return range
		},
		//-----------dependencies--------------//

		constructSelection : function(optRange) {
			var s = window.getSelection(), r = optRange, temp = {};

			if (r&&r.start) 	s.start 	= r.start
			else				s.start 	= s.baseOffset
			if (r&&r.end)		s.end 		= r.end
			else 				s.end 		= s.extentOffset
			if (r&&r.startNode) s.startNode = r.startNode
			else 				s.startNode = s.baseNode
			if (r&&r.endNode) 	s.endNode 	= r.endNode
			else 				s.endNode	= s.extentNode
			
			s.direction = this.determineDirection(s)

			if (s.direction == "left")
			{
				temp.start 		= s.start 	
				temp.end 		= s.end 		
				temp.startNode 	= s.startNode 
				temp.endNode	= s.endNode	
				
				s.start 	= temp.end
				s.end 		= temp.start
				s.startNode = temp.endNode
				s.endNode	= temp.startNode
			}

			s.startEl 	= this.determineParentNode(s.startNode)
			s.endEl 	= this.determineParentNode(s.endNode)
			s.startBlock	= this.determineBlock(s.startNode)
			s.endBlock 		= this.determineBlock(s.endNode)
			s.type 	= this.determineSelectionType(s)
			s.startBlock_firstNode 	= this.determineTextNode(s.startBlock, "first")
			s.startBlock_lastNode 	= this.determineTextNode(s.startBlock, "last")
			s.endBlock_firstNode 	= this.determineTextNode(s.endBlock, "first")
			s.endBlock_lastNode 	= this.determineTextNode(s.endBlock, "last")
			
			delete s.anchorNode
			delete s.anchorOffset
			delete s.focusNode
			delete s.focusOffset
			// delete s.baseNode
			// delete s.baseOffset
			// delete s.extentNode
			// delete s.extentOffset

			return s
		},
			determineDirection : function(s) {
				var direction = s.startNode.compareDocumentPosition(s.endNode)

				if (direction == 2)
					return "left"
				else if (direction == 4)
					return "right"
				else if (direction == 0 && s.start > s.end)
					return "left"
				else if (direction == 0 && s.start < s.end)
					return "right"
				else if (direction == 0 && s.start == s.end)
					return "up"
			},
			determineBlock : function(focusNode) {
				var parentBlock

				if (focusNode.parentNode.nodeName == "BLOCK")
					parentBlock = focusNode.parentNode
				
				else if (focusNode.parentNode.nodeName == "SEED")
					parentBlock = focusNode.parentNode.parentNode
				
				else if (focusNode.nodeName == "BLOCK")
					parentBlock = focusNode

				return parentBlock
			},
			determineSelectionType : function(s) {
				var type
				if (s.startNode === s.endNode && s.start == s.end) //no selection
					type = "cursor"
				else if (s.startNode === s.endNode) 	//select confined to node
					type = "node"
				else if (s.startBlock === s.endBlock) 	//select confined to block
					type = "block"
				else 									//select spans multiple blocks
					type = "document"	

				return type
			},
			determineParentNode : function(node) {
				if (node.parentNode.nodeName == "SEED")
					return node.parentNode
				else if (node.parentNode.nodeName == "BLOCK")
					return node
				else if (node.nodeName == "BLOCK") //"<block><br></block>"
					return node.childNodes[0]
			},
			determineTextNode : function(block, which) {
				var children = block.childNodes,
					el
				
				if(which == "first")
					el = children[0]
				else if (which == "last")
					el = children[children.length - 1]

				if (el.nodeName == "#text")
					return el
				else if (el.nodeName == "SEED")
					return el.childNodes[0]
			},


		constructRangeFromSelection : function(s) {
			var range = {
				selection : s,
				blocks 	: []
			},
			block, blockID, blockContent, focusNode, focusBlock;

			focusBlock = s.startEl.parentNode

			while (focusBlock)
			{
				block 	= document.createElement('block')
				blockID = this.getBlockID(focusBlock)
				block.setAttribute('data-id', blockID)
				//set next blocks focus node
				if (range.blocks.length !== 0) 
					 focusNode = focusBlock.childNodes[0]
				else focusNode = s.startEl
				//grab content
				blockContent 	= this.nodeCrawl(focusNode, s)
				block.innerHTML = blockContent.inner

				range.blocks.push(block)
				
				if (focusBlock === s.endBlock) focusBlock = false
				else focusBlock = focusBlock.nextSibling
			}

			return range
		},
			nodeCrawl : function(focus, s) {
				var string = "", length = 0,
					content;
				
				if (s.startNode === s.endNode)
					 return this.extractInnerNode(s)

				while ( focus && s.direction !== "up") 	//grab content
				{	//end nodes
					if (focus === s.startEl) {
						content = this.extractPartial(focus, s, "start")
					}
					else if (focus === s.endEl) {
						content = this.extractPartial(s.endEl, s, "end")
					}
					//middle nodes
					else {
						content = this.extractFull(focus, s)
					}
					string += content.str
					length += content.len

					if (focus === s.endEl) focus = false
					else focus = focus.nextSibling
				}
				return { inner:string , length:length } 
			},
			extractFull : function(node, s) {
				var str, len
				if (node.nodeName == "SEED") {
					str = node.outerHTML
					len = node.innerHTML.length	
				}
				else if (node.nodeName == "#text") {
					str = node.nodeValue
					len = str.length
				}
				return {str : str, len : len}
			},
			extractPartial : function(node, s, partial) {
				var str, len

				if (node.nodeName == "#text")
					node = node
				else if (node.nodeName == "SEED")
					node = node.childNodes[0]

				str = node.textContent

				if (partial == "start") {
					str = str.substr(s.start, node.length)				
					len = node.length - s.start
				}
				else if (partial == "end") {
					str = str.substr(0, s.end)
					len = s.end
				}

				return { str:str , len:len }
			},

			extractInnerNode : function(s) {
				var node = s.startNode, length, str, len;
		
				length = node.length
				str = node.textContent
				str = str.substring(s.start, s.end)
				len = s.end - s.start
				
				return { inner:str , length:len }
			},

			getBlockID : function(blockNode) {
				var id
				if (blockNode.nodeName === "BLOCK")
				{
					var attrs = blockNode.attributes
					if (attrs.hasOwnProperty('data-id')) 
					{
						id = attrs['data-id']
					}
				}
				if (id)
					return id.nodeValue
			},

	}
}())