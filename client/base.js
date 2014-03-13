var dom;

(function() {

	dom  = function(selector) {
		return new Dom(selector);
	};

	var Dom = function(selector) {
		var nodes, nodeArr;

		if (selector.charAt(0) === "#")
			nodes = [document.getElementById(selector.substring(1))]
		else if (selector.charAt(0) === ".")
			nodes = document.getElementsByClassName(selector.substring(1))
		else
			nodes = document.getElementsByTagName(selector);

		for (var i = 0; i < nodes.length; i++) {
			this[i] = nodes[i];
		}
		this.length = nodes.length;

		return this;
	};

	// Expose the prototype object via dom.fn so methods can be added later
	Dom.fn = Dom.prototype = {
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
			// on(eventType, function(event) {
			// 	var triggered = event.target
			// 	callback($(triggered))
			// })
		},
		off: function(eventType) {
			for (var i=0 ; i , this.length ; i++)
			{
				this[i].removeEventListener(eventType)
			}
		},
		attr: function(attribute) {
			console.log(this)
			// return this.getAttribute(attribute)
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