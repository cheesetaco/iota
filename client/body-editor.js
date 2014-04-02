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
				case 9 : 
					event.preventDefault()
					console.log('tab')
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
	var self, s, range, master,
		eater, eaten, eatenID;

	return {
		init: function() {
			sb.listen({
				'(:body)model/post[delete]' : this.cacheMaster,
				'(body:editor)view/keys/delete' : this.rangeOrCaret
			})
			sb.dispatch('(:body)model/get', {event:"delete"})
		},
		destroy: function() {
			sb.ignore('(body:editor)view/keys/delete')
		},
		cacheMaster : function(evt) {
			master = evt.data
		},

		rangeOrCaret : function(evt) {
			self = evt.self
			s = window.getSelection()
			
			var cursorAtStart = (s.baseOffset == 0)
			if (s.type == "Caret" && cursorAtStart)
				self.Caret()
			else if (s.type == "Range" && !cursorAtStart)
				self.Range()
			//else let DOM do its default delete
		},
			Range : function() {
				self.doesEatenHaveIDToBeConserved()
			},
			Caret : function() {	
				self.doesEatenHaveIDToBeConserved()
			},
			doesEatenHaveIDToBeConserved : function() {
				var	eatenBlock = sb.utils.determineParentBlock(s.baseNode);
				console.dir(eatenBlock)// if (eatenBlock)
				eatenID	= sb.utils.getBlockID(eatenBlock)

				if (eatenID) self.doesEaterHaveIDToBeConserved()
			},
			doesEaterHaveIDToBeConserved : function() {
				window.setTimeout(function() //wait 1 ms to reference the correct selection
				{
					var eaterBlock = sb.utils.determineParentBlock(s.baseNode),
						eaterBlockID = sb.utils.getBlockID(eaterBlock);

					if (!eaterBlockID)
						self.eaterEatEatenID(eaterBlock)
					else
						console.log('I have an ID')
				}, 1) 
			},
			eaterEatEatenID : function(eaterBlock) {
				eaterBlock.setAttribute('data-id', eatenID)
			},


		//______________________for merging blocks when they both have IDs______________________________
		// 	caret : function() {

		// 		var blockHolder = document.createElement('BLOCKHOLDER');
		// 		blockHolder.setAttribute('contenteditable', 'false')
		// 		blockHolder.setAttribute('data-id', eatenID)

		// 		window.setTimeout(function() {//wait 1 ms to reference the correct selection
					
		// 			self.seedOrText(blockHolder)//insert BlockHolder and/or break up textNodes

		// 			self.resetCursor(s.baseNode, s.baseNode.length)

		// 		}, 1) 
		// 	},
		// 		seedOrText : function(blockHolder) {
		// 			var parentBlock, eater, eaterIsSeed, eaten, eatenIsSeed, bothNodesAreText;
					
		// 			eater = sb.utils.determineParentNode(s.baseNode)
		// 			eaten = eater.nextSibling
		// if(eaten) { eatenIsSeed = (eaten.nodeName == "SEED") }
		// 			eaterIsSeed = (eater.nodeName == "SEED")
					
		// 			bothNodesAreText = (!eaterIsSeed && !eatenIsSeed)
		// 			parentBlock = sb.utils.determineParentBlock(eater)

		// 			if (bothNodesAreText)
		// 				self.text(eater, parentBlock, blockHolder)
		// 			else
		// 				self.seed(eater, parentBlock, blockHolder, eaten)
		// 		},
		// 			text : function(eater, parentBlock, blockHolder) {
		// 				var siamese = eater.textContent,
		// 					twin1 = siamese.substring(0, s.baseOffset),
		// 					twin2 = siamese.substring(s.baseOffset, siamese.length),
		// 					twinNode2 = document.createTextNode(twin2);

		// 				eater.textContent = twin1				
		// 				parentBlock.insertBefore(blockHolder, eater.nextSibling)
		// 				parentBlock.insertBefore(twinNode2, blockHolder.nextSibling)
		// 			},
		// 			seed : function(eater, parentBlock, blockHolder, eaten) {
		// 				parentBlock.insertBefore(blockHolder, eaten)
		// 			},
		// 	//________end caret________________________________________________

		// checkRangeIsStart : function() {
		// 	var extentBlock = sb.utils.determineParentBlock(sel.extentNode),
		// 		baseBlock 	= sb.utils.determineParentBlock(sel.baseNode),
		// 		extentBlockFirstNode = extentBlock.childNodes[0],
		// 		baseBlockFirstNode 	 = baseBlock.childNodes[0],

		// 		extentAtBeginning = (sel.extentOffset==0 && sel.extentNode === extentBlockFirstNode),
		// 		baseAtBeginning   = (sel.baseOffset==0 && sel.baseNode === baseBlockFirstNode);

		// 	if (extentAtBeginning)
		// 		return {
		// 			event: "checkBlockIsBlank", 
		// 			block: extentBlock
		// 		}
		// 	else if (baseAtBeginning)
		// 		return {
		// 			event: "checkBlockIsBlank", 
		// 			block: baseBlock
		// 		}				
		// 	else 
		// 		return "you dont need to know"
		// },


		// resetCursor : function(node, offset) {
		// 	range.setEnd(node, offset)

		// 	range.collapse(false) //send caret to end of range
		// 	s.removeAllRanges()//?
		// 	s.addRange(range) //select the range	
		// },		


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
