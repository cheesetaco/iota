"use strict"
CORE.register('body:editor', function() {
	return {
		init: function() {
			CORE.start('body:view/editor/keys')
			CORE.start('body:view/editor/start')
		},
		destroy: function() {
			CORE.stop('body:view/editor/keys')
			CORE.stop('body:view/editor/start')
		}
	}
})

CORE.register('body:view/editor/start', function(sb) {
	var $content_container = sb.dom('#content');

	return {
		init: function() {
			console.log('hi')
			sb.listen({
				'(sidebar)view/buttons/edit/on' : this.startEditor,
				'(sidebar)view/buttons/edit/off': this.stopEditor
			})
		},
		destroy: function() {
			sb.ignore(['(sidebar)view/buttons/edit/on', '(sidebar)view/buttons/edit/off'])
		},
		startEditor : function() {
			sb.dispatch('view/editor/on')

			$content_container.attr('contenteditable', true)
		},
		stopEditor : function() {
			sb.dispatch('view/editor/off')

			$content_container.attr('contenteditable', false)
		},
		body_checkifEmpty : function() {

		},

	}
})
CORE.register('body:view/editor/keys', function(sb) {
	var $content_container = sb.dom('#content');

	return {
		init : function() {
			sb.listen({
				'view/editor/on' : this.armKeys,
				'view/editor/off' : this.disarmKeys
			})
		},
		destroy : function() {
			sb.mute(['view/editor/on','view/editor/off'])
		},
		armKeys : function() {
			$content_container.on("keydown", function(event) {
				var key = event.which
				
				switch (key)
				{	
					case 13 :
						this.enter()
						break
					default :
						console.log("nah")
				}
				

			})
		}
	}
})




	// var editMode = {

	// 	startupTextEditor: function() 
	// 	{
	// 		//if the content div is empty, create new children blocks
	// 		var divContent = document.getElementById('content'),
	// 			block = document.createElement("block");
	// 		block.innerHTML = "<br>";
	// 		if (divContent.getElementsByTagName("block").length == 0) //no block
	// 		{
	// 			console.log('ham')
	// 			divContent.appendChild(block)
	// 		}

	// 		view.globals.$contentContainer.on("keydown.enter", function(e)
	// 		{
	// 			//handle enter key
	// 			if (e.which == 13) {
	// 				e.preventDefault();

	// 				editMode.newlineEnter();
	// 			}
	// 		});
	// 	},
	// 	shutdownTextEditor: function() 
	// 	{
	// 		view.globals.$contentContainer.off("keydown.enter")
	// 	},
	// 	newlineEnter: function()
	// 	{
	// 		var block = document.createElement("block"),
	// 			range = document.createRange(),
	// 			userSelection = window.getSelection(),
	// 			selectionStart = userSelection.baseOffset,
	// 			selectionEnd = userSelection.extentOffset,
	// 			selectionStartNode = userSelection.baseNode;

	// 		//blinking cursor cases
	// 		if (selectionStartNode === userSelection.extentNode
	// 			&& selectionStart === selectionEnd)
	// 		{
	// 			var cursorPosition = selectionStart,
	// 				cursorNode = selectionStartNode,
	// 				nodeEndPosition = cursorNode.length;
				
	// 			caretCases()
	// 		}

	// 		function caretCases() {

	// 			//modify selection: select all text to the right of user caret						
	// 			range.setStart(cursorNode, cursorPosition)
	// 			range.setEnd(cursorNode, nodeEndPosition)

	// 			///cursor is at the beginning of a paragraph {grab everything and prepend a br block}
	// 			if (cursorPosition == 0)
	// 			{
	// 				//create block
	// 				var documentFragment = '<br>';

	// 				block.innerHTML = documentFragment;

	// 				//append new block
	// 				if (cursorNode.innerHTML == '<br>') // empty block
	// 					var selectionNode = cursorNode; 
	// 				else
	// 					var selectionNode = cursorNode.parentNode; //full block
	// 				$(selectionNode).before(block)
				

	// 				//recalibrate range to include the new block
	// 				range.setEnd(cursorNode, cursorPosition);
	// 			}
	// 			else
	// 			{
	// 			/// cursor is at the end of a paragraph
	// 				var lengthFromEnd = range.endOffset - range.startOffset
	// 				if (lengthFromEnd == 0) 
	// 				{
	// 					var nextNode = checkForSibling();
					
	// 					if(nextNode !== undefined) //cursor isn't at the end of paragraph
	// 						var documentFragment = getTextToRightOfCaret()
	// 					else
	// 						var documentFragment = "<br>"
	// 				}

	// 			/// cursor is in middle of paragraph
	// 				else
	// 					var documentFragment = getTextToRightOfCaret()		

	// 				block.innerHTML = documentFragment;
	// 				//append new block
	// 				var selectionNode = cursorNode.parentNode;
	// 				$(selectionNode).after(block)

	// 				//recalibrate range to include the new block
	// 				range.setEnd(cursorNode.parentNode.nextSibling, 0);	
	// 			}

	// 			//reposition caret based on the new range
	// 			range.collapse(false) //send caret to end of range
	// 			userSelection.removeAllRanges()
	// 			userSelection.addRange(range) //select the range
	// 		}

	// 		function getTextToRightOfCaret() {

	// 			//grab the remainder of the paragraph following the cursor
	// 			var	documentFragment = cursorNode.textContent.slice( cursorPosition, nodeEndPosition ),
	// 				startSlice 	= 0,
	// 				endSlice 	= cursorPosition;
	// 			cursorNode.textContent = cursorNode.textContent.slice(0,endSlice)

	// 			var nextNode = checkForSibling();
	// 			//yes? crawl siblings
	// 			if (nextNode !== undefined)
	// 				var documentFragment = crawlSiblings(nextNode, documentFragment)

	// 			//catch and replace whitespace
	// 			if (documentFragment.charAt(0) == " ")
	// 				documentFragment = "&nbsp;" + documentFragment.substr(1)
				
	// 			return documentFragment
	// 		}
	// 		function checkForSibling() {
	// 			var nextNode;
	// 			if (cursorNode.parentNode.nodeName == 'BLOCK') 
	// 			{	
	// 				if (cursorNode.nextSibling !== null)
	// 					nextNode = cursorNode.nextSibling
	// 			}
	// 			else if (cursorNode.parentNode.nodeName == 'SEED')
	// 			{	
	// 				if (cursorNode.parentNode.nextSibling !== null)
	// 					nextNode = cursorNode.parentNode.nextSibling
	// 			}

	// 			return nextNode
	// 		}

	// 		function crawlSiblings(focusNode, documentFragment)
	// 		{
	// 			var workingFragment = documentFragment
	// 			var hasSibling = true;

	// 			while(hasSibling)
	// 			{
	// 				hasSibling = false;

	// 				//grab the html from the sibling, also remove those contents from the previous paragraph
	// 				if (focusNode.nodeName == "SEED")
	// 				{
	// 					workingFragment += focusNode.outerHTML
	// 					focusNode.parentNode.removeChild(focusNode) 
	// 				}
	// 				else if (focusNode.nodeName == "#text")
	// 				{
	// 					workingFragment += focusNode.textContent
	// 					focusNode.parentNode.removeChild(focusNode)						
	// 				}

	// 				//is there another sibling?
	// 				if (focusNode.nextSibling)
	// 				{
	// 					focusNode = focusNode.nextSibling;
	// 					hasSibling = true
	// 				}
	// 			}

	// 			//send the final contents back to be injected
	// 			return workingFragment;
	// 		}

	// 	}
	// }
