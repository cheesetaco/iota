"use strict"

var dom;

(function() {

	dom  = function(selector) {
		return new Dom(selector);
	};

	var Dom = function(selector) {
		var err = ["failure: no match", "failure: selector must be string or dom object"],
			pushNodes = function() {
				if (nodes.length == 0)
					throw err[0]
				else {			
					for (var i = 0; i < nodes.length; i++) {
						this[i] = nodes[i];
					}
					this.length = nodes.length;
				}
				return this;
			},
		
		nodes, nodeArr, type;

		if (typeof selector === "string")
			type = "string"
		else if (selector instanceof HTMLElement)
			type = "element"
		else if (typeof selector === "object")
			type = "object"

		//stage and return new dom object or return selector
		if (type == "string")
		{
			if (selector.charAt(0) === "#")
				nodes = [document.getElementById(selector.substring(1))]
			else if (selector.charAt(0) === ".")
				nodes = document.getElementsByClassName(selector.substring(1))
			else
				nodes = document.getElementsByTagName(selector);
			pushNodes.call(this)
		}
		else if (type == "element")
		{
			nodes = [selector]
			pushNodes.call(this)	
		}
		else if (type == "object" && selector instanceof Dom)
			return selector	
		else
			return selector		
	};

	// Expose the prototype object via dom.fn so methods can be added later
	dom.fn = Dom.prototype = {
		// API Methods
		on : function(eventType, callback) {
			//this points to the dom instance Object
			for (var i=0 ; i < this.length ; i++)
			{
				var event = {
					target : this[i],
					type : eventType
				}
				this[i].addEventListener(eventType, function() {
					callback.call(this, event)
				})
			}

		},
		off: function(eventType) {
			for (var i=0 ; i , this.length ; i++)
			{
				this[i].removeEventListener(eventType)
			}
		},
		attr: function(attribute, value) {
			var elem = this[0];

			// if (typeof attribute === "object")
			// {
			// 	var obj = attribute;
			// 	for (var prop in obj)
			// 	{
			// 		elem.setAttribute( prop, obj[prop] )
			// 	}
			// }
			if (value)
			{
				elem.setAttribute(attribute, value)
			}
			else
				return elem.getAttribute(attribute)

		},
		css : function(attribute, value) {
			var elem = this[0],

				style, attr;

			if (typeof attribute === "object")
			{
				var obj = attribute;
				for (var prop in obj)
				{
					elem.style[ prop ] = obj[prop]
				}
			}
			if (value) {
				elem.style[attribute] = value
			}
			else
			{
				style = window.getComputedStyle(elem),
				attr = style.getPropertyValue(attribute)
			}

				return attr
		},




		hide: function() {
			for (var i = 0; i < this.length; i++) {
				this[i].style.display = 'none';
			}
			return this;
		},
		remove: function() {
			for (var i = 0; i < this.length; i++) {
				this[i].parentNode.removeChild(this[i]);
			}
			return this;
		}
		// More methods here, each using 'return this', to enable chaining
	};

}())