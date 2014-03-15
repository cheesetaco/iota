"use strict"

var CORE = (function ($) {
	var modLib = {}, cacheLib = {}, _dom, _utilities;

	_utilities = {
		is_obj : function (obj) {
			return $.isPlainObject(obj);         
		},
		is_arr : function (arr) {
			return $.isArray(arr);         
		},
	}


	//methods inside CORE object
	return {
		dom : function(selector) {
			return dom(selector)
		},

		util : _utilities,

		register : function(moduleID, constructor) {
			modLib[moduleID] = {
				instantiate : constructor,
				instance 	: null
			}
		},
		list : function() {
			return (modLib)
			// console.log(modLib)
		},
		start : function (moduleID) {
			var mod = modLib[moduleID],
				
				sandbox = Sandbox.build(this, moduleID);

			if (mod) {
				mod.instance = mod.instantiate(sandbox);
				console.log("started: "+moduleID)
				mod.instance.init();
			}
		},
		stop : function(moduleID) {
			var mod = modLib[moduleID];
			if (mod.instance) {
				mod.instance.destroy()
				mod.instance = null
				console.log("stopped: "+moduleID)
			}
		},
		startAll : function() {
			var mod;

			for (mod in modLib)
			{
				if(modLib.hasOwnProperty(mod))
					this.start(mod)
			}
		},
		stopAll : function() {
			var mod;
			
			for (mod in modLib)
			{
				if(modLib.hasOwnProperty(mod))
					this.stop(mod)
			}

		},
		registerEvents : function(events, moduleID)
		{
			var mod = moduleID,
				evt, evts;

			if (this.util.is_obj(events) && mod && (mod = modLib[mod]) ) 
			{
				if (!(evts = mod.events)) //create property: events object
					{
						mod.events = events
					}
				else //add or replace events
				{					
					for (evt in events)//cycle through events obj
					{
						mod.events[evt] = events[evt] //add event to module
					}
				}
			}
		},
		unregisterEvents : function(events, moduleID)
		{
			var mod = moduleID,
				evt, evts;
			if (this.util.is_arr(events) && mod && 
				(mod = modLib[mod]) && mod.events) 
			{
				// console.log(events)
				for ( evt in (evts = mod.events) )
				{
					for (i=0 ; i<events.length ; i++)
					{
						if (evt == events[i]) {
							delete mod.events[evt]
						}
					}
				}
			}
		},
		triggerEvent: function(eventObj) {
			var event, mod;

			if (typeof eventObj === "object") 
				event = eventObj.type;
			else if (typeof eventObj === "string") //adjust variables if eventObj is a string :: has no data
				event = eventObj

				
			for (mod in modLib)
			{
				if(modLib.hasOwnProperty(mod))
				{
					mod = modLib[mod];

					if (mod.events && mod.events[event]) {
						// console.log(mod.events[event])
						mod.events[event](eventObj);//trigger event and send to callback
					}
				}
			}

		},
		cache: function(obj) {
			cacheLib[obj.name] = obj.data
		},
		getCacheLib : function() {
			return cacheLib
		}

	}
}(jQuery))


var Sandbox = (function() {
	return {
		build : function (core, module_ID) {
			//object to return to module on creation through paramater (sandbox) 
			return {
				dom : function (selector) {
					return core.dom(selector)
				},
				listen : function(events) {
					if (core.util.is_obj(events)) 
					{
						core.registerEvents(events, module_ID);
					}
				},
				ignore: function(events) { //array

					if (core.util.is_arr(events))
					{
						core.unregisterEvents(events, module_ID)
					}
				},
				dispatch: function(eventObj) {
					core.triggerEvent(eventObj)
				},
				cacher: function(obj) {
					core.cache(obj)
				},
				cache: (function() {
					return core.getCacheLib()
				}())
			}
		}
	}
}())