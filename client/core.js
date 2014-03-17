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
		registerEvents : function(eventObj, callback, moduleID)
		{
			var mod = moduleID,
				module, evt;

			if ( mod && (module = modLib[mod]) ) 
			{
				if (!module.events && !callback)
				{
					module.events = eventObj
					module.events.asker = moduleID
				}
				else if (!module.events && callback)
				{
					module.events = {}
					module.events[eventObj] = callback
					module.events.asker = moduleID
				}
				else if (module.events && callback)
				{
					module.events[eventObj] = callback			
				}
				else if (module.events && !callback) 
				{
					for (evt in eventObj)
					{
						module.events[evt] = eventObj[evt]
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
					for (var i=0 ; i<events.length ; i++)
					{
						if (evt == events[i]) {
							delete mod.events[evt]
						}
					}
				}
			}
		},
		triggerEvent: function(eventObj, data) {
			var event, prop, mod, asker, askerInst;
			
			if (data)
			{
				if (typeof eventObj === "string") { 
					event = eventObj
					eventObj = {data: data}
				}
			}
			else if (typeof eventObj === "string") //adjust variables if eventObj is a string :: has no data
				event = eventObj
			else if (typeof eventObj === "object")
				event = eventObj.type;
			
console.log("_EVENT_: "+event)

			for (prop in modLib)
			{
				if(modLib.hasOwnProperty(prop))
				{
					mod = modLib[prop];

					if (mod.events && mod.events[event]) 
					{
						asker 	  = mod.events.asker,
						askerInst = modLib[asker].instance,
						eventObj  = {	event 	: event,
										data 	: eventObj.data,
										asker 	: askerInst	 }

						mod.events[event](eventObj);//trigger event and send to callback
					}
				}
			}

		},
		cache: function(cachee, value) {
			if (value) {
				if (typeof cachee === "string") 
					cacheLib[cachee] = value
			}
			else if (typeof cachee === "string") 
				return cacheLib[cachee]
			
			else if (typeof cachee === "object")
				cacheLib[cachee.name] = cachee.data

			else
				console.log('youfuckingseriousman?')
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
				listen : function(events, callback) {

					if (callback && typeof callback === "function" && typeof events === "string") 
						core.registerEvents(events, callback, module_ID)
					else if (typeof events === "object") 
						core.registerEvents(events, null, module_ID);

				},
				ignore: function(events) { //array

					if (core.util.is_arr(events))
					{
						core.unregisterEvents(events, module_ID)
					}
				},
				dispatch: function(eventObj, data) {
					core.triggerEvent(eventObj, data)
				},
				cache: function(cachee, data) {
					var returned = core.cache(cachee, data)
					if (returned)
						return returned
				}
			}
		}
	}
}())