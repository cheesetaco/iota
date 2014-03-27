// get selection and its contents, 
// if cursor : return content in block to right
// if selection : return content in selection
"use strict"
var selection = (function() {
	var s = {}

	return {
		//----------------API------------------//

		getSelection : function(optRange) {
			var sel = this.constructSelection(optRange)
			s = sel
			return s
		},
		cutSelection : function(optRange) {
			var s, range
			
			if (optRange)
				s = this.getSelection(optRange)
			else 
				s = this.getSelection()

			range = this.extractSelection(s)
			return range
		},
		deleteContent : function() {
			if (!(s instanceof Selection)) {
				this.getSelection()
			}

			s.deleteFromDocument()
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
			s.scope 		= this.determineSelectionScope(s)
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
			determineSelectionScope : function(s) {
				var scope
				if (s.startNode === s.endNode && s.start == s.end) //no selection
					scope = "cursor"
				else if (s.startNode === s.endNode) 	//select confined to node
					scope = "node"
				else if (s.startBlock === s.endBlock) 	//select confined to block
					scope = "block"
				else 									//select spans multiple blocks
					scope = "document"	

				return scope
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


		extractSelection : function(s) {
			var range, focusBlock

			range = {
				selection : s,
				blocks 	: []
			}
			focusBlock = s.startEl.parentNode

			while (focusBlock)
			{
				var block, content, focusNode
				
				//set next blocks focus node
				if (range.blocks.length !== 0) //not first node
					 focusNode = focusBlock.childNodes[0]
				else focusNode = s.startEl
				
				content = this.nodeCrawl(focusNode, s)
				block 	= this.createBlock(focusBlock, content)
				
				range.blocks.push(block)
				
				if (focusBlock === s.endBlock) focusBlock = false
				else focusBlock = focusBlock.nextSibling
			}

			return range
		},
			createBlock : function (focusBlock, content) {
				var	block, blockID, blockInnerLength, blockLength
				
				block = document.createElement('block')
				//grab content
				block.innerHTML = content.inner	
				
				//determine which block gets ID
				blockInnerLength = content.length
				blockLength 	 = this.getBlockLength(focusBlock)
				
				if (blockLength < blockInnerLength) 
				{
					blockID = this.getBlockID(focusBlock)
					block.setAttribute('data-id', blockID)
					focusBlock.removeAttribute('data-id')
				}

				return block
			},

			nodeCrawl : function(focus, s) {
				var string = "", length = 0,
					next, content;
				
				if (s.startNode === s.endNode)
					 return this.extractInnerNode(s)

				while ( focus && s.direction !== "up") 	//grab content
				{	
					next = focus.nextSibling

					//start node
					if (focus === s.startEl) 
						content = this.extractPartial(focus, s, "start")
					//end node
					else if (focus === s.endEl) 
						content = this.extractPartial(s.endEl, s, "end")
					//middle node(s)
					else {			
						content = this.extractFull(focus, s)
					}
					
					string += content.str
					length += content.len

					if (focus === s.endEl) 	focus = false
					else 					focus = next
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
				//cut
				node.parentNode.removeChild(node)
				//paste
				return {str : str, len : len}
			},
			extractPartial : function(node, s, partial) {
				var str, len, cut, leftovers

				if (node.nodeName == "#text")
					node = node
				else if (node.nodeName == "SEED")
					node = node.childNodes[0]

				str = node.textContent

				if (partial == "start") {
					cut 		= str.substr(s.start, node.length)
					leftovers 	= str.substr(0, s.start)
					len 		= node.length - s.start
				}
				else if (partial == "end") {
					cut 		= str.substr(0, s.end)
					leftovers 	= str.substr(s.end, node.length)
					len 		= s.end
				}
				
				node.textContent = leftovers

				return { str:cut , len:len }
			},

			extractInnerNode : function(s) {
				var node = s.startNode, 
				str, cut, len, leftovers;
		
				str 		= node.textContent
				cut 		= str.substring(s.start, s.end)
				leftovers 	= str.substring(0, s.start)
				len 		= s.end - s.start
				
				node.textContent = leftovers

				return { inner:cut , length:len }
			},
			getBlockLength : function(blockNode) {
				var children = blockNode.childNodes,
					length = 0

				for (var i=0 ; i<children.length ; i++) 
				{
					var child = children[i]

					if (child.nodeName == "SEED")
						length += child.innerHTML.length
					else if (child.nodeName == "#text")
						length += child.length
				}

				return length
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
