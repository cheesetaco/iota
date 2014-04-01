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
			// CORE.stop("body:editor:view/keys/delete/deleteCharacter")
			CORE.stop('body:editor:view/keys/delete/mergeBlocks')
			CORE.stop('body:editor:view/keys/delete/checkBlockIsBlank')
			CORE.stop('body:editor:view/keys/delete')
			CORE.stop('body:editor:view/keys/delete/preventBlankDocument')
			CORE.stop('body:editor:view/keys/arm')
		},
		create : function() {
			CORE.start('body:editor:model/container')
			CORE.start('body:editor:model/selection/post')
			CORE.start('body:editor:view/keys/enter')
			// CORE.start("body:editor:view/keys/delete/deleteCharacter")
			CORE.start('body:editor:view/keys/delete/mergeBlocks')
			CORE.start('body:editor:view/keys/delete/checkBlockIsBlank')
			CORE.start('body:editor:view/keys/delete')
			CORE.start('body:editor:view/keys/delete/preventBlankDocument')
			CORE.start('body:editor:view/keys/arm')
			
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
			this.disarmKeys()
		},

		armKeys : function(event) {
			self = event.self
			$container = $('#content')

			self.keydown()
			self.keyup()
		},
		disarmKeys : function() {
			$container.off('keydown')
			$container.off('keyup')
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
					// event.preventDefault()
					sb.dispatch('(body:editor)view/keys/delete')
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
CORE.register('body:editor:view/keys/delete', function(sb) {
	var self, sel, master;
	return {
		init: function() {
			sb.listen({
				'(:body)model/post[delete]' : this.cacheMaster,
				'(body:editor)view/keys/delete' : this.whatAction
			})
			sb.dispatch('(:body)model/get', {event:"delete"})
		},
		destroy: function() {
			sb.ignore('(body:editor)view/keys/delete')
		},
		cacheMaster : function(evt) {
			master = evt.data
		},
		whatAction : function(evt) {
			self = evt.self
			sel = window.getSelection()
			var parentBlock = self.getParentBlock(sel.baseNode),
			parentID = sb.utils.getBlockID(parentBlock);

			//pressed delete at start of block
			if (sel.type == 'Caret' && sel.baseOffset == 0) {
				self.mergeBlocks(parentID)
			}
			// else if (sel.type == 'Range')
			// 	sb.dispatch("(body:editor)view/keys/delete/checkBlockIsBlank", data)


		},
		mergeBlocks : function(parentID) {
			var s = window.getSelection(),
				range = document.createRange(),

			// if (parentID) {
				blockHolder = document.createElement('BLOCKHOLDER');
				blockHolder.setAttribute('contenteditable', 'false')
				blockHolder.setAttribute('data-id', parentID)
			// }

			window.setTimeout(function() {//wait 1 ms to reference the correct selection
				var parentNode = self.getParentNode(s.baseNode),
					siblingNode = parentNode.nextSibling;
				
				//Manipulate DOM based on what DOM is trying to merge
				if (parentNode.nodeName == "#text" && siblingNode && siblingNode.nodeName == "#text")
				{
					var twinNode2 = self.splitMergedTextNodes(s)
					self.insertSplitNodesAndBlockHolder(s, twinNode2, blockHolder)
				}
				else
					self.justInsertBlockHolder(s, blockHolder)

				//fix cursor position
				range.setEnd(s.baseNode, s.baseNode.length)
				range.collapse(false) //send caret to end of range
				s.removeAllRanges()//?
				s.addRange(range) //select the range	
			}, 1) 
		},
			splitMergedTextNodes : function(s) {
				var siamese = s.baseNode.textContent,
				twin1 = siamese.substring(0, s.baseOffset),
				twin2 = siamese.substring(s.baseOffset, siamese.length),
				twinNode2 = document.createTextNode(twin2)
				s.baseNode.textContent = twin1				

				return twinNode2
			},
			insertSplitNodesAndBlockHolder : function(s, twinNode2, blockHolder) {
				//put nodes and BLOCKHOLDER in the DOM
				parentBlock = self.getParentBlock(s.baseNode);
				parentBlock.insertBefore(blockHolder, s.baseNode.nextSibling)
				parentBlock.insertBefore(twinNode2, blockHolder.nextSibling)
			},
			justInsertBlockHolder : function(s, blockHolder) {
				var parentBlock = self.getParentBlock(s.baseNode),
					parentNode = self.getParentNode(s.baseNode),
					sibling = parentNode.nextSibling
console.log(parentNode)
				parentBlock.insertBefore(blockHolder, sibling)
			},
			determineNodeType: function(node) {
				if (node) {
					if (node.parentNode.nodeName == "BLOCK")
						return "#text"
					else if (node.parentNode.nodeName == "SEED")
						return "seed"
				}
			},
		checkRangeIsStart : function() {
			var extentBlock = self.getParentBlock(sel.extentNode),
				baseBlock 	= self.getParentBlock(sel.baseNode),
				extentBlockFirstNode = extentBlock.childNodes[0],
				baseBlockFirstNode 	 = baseBlock.childNodes[0],

				extentAtBeginning = (sel.extentOffset==0 && sel.extentNode === extentBlockFirstNode),
				baseAtBeginning   = (sel.baseOffset==0 && sel.baseNode === baseBlockFirstNode);

			if (extentAtBeginning)
				return {
					event: "checkBlockIsBlank", 
					block: extentBlock
				}
			else if (baseAtBeginning)
				return {
					event: "checkBlockIsBlank", 
					block: baseBlock
				}				
			else 
				return "you dont need to know"
		},
		getParentBlock : function(node) {
			if (node.parentNode.nodeName == "SEED")
				return node.parentNode.parentNode
			else if (node.parentNode.nodeName == "BLOCK")
				return node.parentNode
		},
		getParentNode : function(node) {
			if (node.parentNode.nodeName == "SEED")
				return node.parentNode
			else if (node.parentNode.nodeName == "BLOCK")
				return node
			else if (node.nodeName == "BLOCK") //"<block><br></block>"
				return node.childNodes[0]			
		}

	}
})
CORE.register('body:editor:view/keys/delete/mergeBlocks', function(sb) {
	return {
		init: function() {
			sb.listen('(body:editor)view/keys/delete/mergeBlocks', this.createBlockHolder)
		},
		destroy : function() {
			sb.ignore('(body:editor)view/keys/delete/mergeBlocks')
		},


	}
})


CORE.register('body:editor:view/keys/delete/checkBlockIsBlank', function(sb) {
	return {
		init: function() {
			sb.listen('(body:editor)view/keys/delete/checkBlockIsBlank', this.checkBlockIsBlank)
		},
		destroy : function() {
			sb.ignore('(body:editor)view/keys/delete/checkBlockIsBlank')
		},
		checkBlockIsBlank : function(evt) {

// console.log(block)
		},
// 		checkBlockIsBlank : function(block) {
// console.log(master)
// 			var blockID = self.getBlockID(block),
// 				posOfBlockInMaster = function() {
// 					for (var i=0 ; i<master.id.length ; i++)
// 					{
// 						if (master.id[i] == blockID)
// 							return i
// 					}
				
// 				};


// 		},


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
				sb.dispatch('(body:editor)model/selection/post', data)
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

	CORE.register('body:editor:view/keys/delete/preventBlankDocument', function(sb) {

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


// CORE.register("body:editor:view/keys/delete/deleteCharacter", function(sb) {
// 	return {
// 		init: function() {
// 			sb.listen("(body:editor)view/keys/delete/deleteCharacter", this.deleteCharacter)
// 		},
// 		deleteCharacter : function(evt) {
// 			var sel = evt.data.sel,
// 				event = evt.data.event,
// 				range = document.createRange(),
// 				node = sel.baseNode,
// 				str  = node.textContent,
// 				string = str.substring(0,str.length-1)
// // console.log(sel)
// 			node.textContent = string
// 			range.setEnd(node, str.length-1)
// 			range.collapse(false) //send caret to end of range
// 			sel.removeAllRanges()
// 			sel.addRange(range) //select the range			
// 		}
// 	}
// })
