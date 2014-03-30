"use strict"

exports.CORE = (function () {
	var modLib = {}, cacheLib = {}, _dom, _utilities;

	//methods inside CORE object
	return {

		register : function(moduleID, constructor) {
			modLib[moduleID] = {
				instantiate : constructor,
				instance 	: null
			}
		},
		list : function() {
			return (modLib)
		},
		start : function (moduleID) {
			var mod = modLib[moduleID],
				
				sandbox = Sandbox.build(this, moduleID);

			if (mod) {
				mod.instance = mod.instantiate(sandbox);
// console.log("started: "+moduleID)
				mod.instance.init();
			}
		},
		stop : function(moduleID) {
			var mod = modLib[moduleID];
			if (mod.instance) {
				mod.instance.destroy()
				mod.instance = null
				// console.log("stopped: "+moduleID)
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
				module = modLib[mod],
				module, evt;

			if ( mod && modLib[mod] ) 
			{
				if (!module.events && !callback)
				{
					module.events = eventObj
					module.events.selfID = mod
				}
				else if (!module.events && callback)
				{
					module.events = {}
					module.events[eventObj] = callback
					module.events.selfID = mod
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
		triggerEvent: function(event, data) { //clean this up
			var eventObj, prop, mod, selfID, selfInst, self, callback;

// console.log("_EVENT_: "+event)

			for (prop in modLib)
			{
				if(modLib.hasOwnProperty(prop)) //get all properties of all modules
				{
					mod = modLib[prop]
					if (mod.events && (callback = mod.events[event]) ) //check if module has event we want to trigger
					{
						selfID 	 = mod.events.selfID,
						selfInst = modLib[selfID].instance,
						eventObj = {	event 	: event,
										data 	: data,
										self 	: selfInst	}
						
						if (typeof callback == "function")
							callback(eventObj) //trigger listener callback function

						else if (callback instanceof Array) {
							for (var i=0 ; i<callback.length ; i++)
								callback[i](eventObj)
						}
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
		}
	}
}())


var Sandbox = (function() {
	return {
		build : function (core, module_ID) {
			//object to return to module on creation through paramater (sandbox) 
			
			return {
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
					var event;


					if (typeof eventObj === "string")
						event = eventObj
					else if (typeof eventObj === "object")
					{
						event = eventObj.type					
						data  = eventObj.data
					}
					// console.log(event)
					// console.log(data)
					core.triggerEvent(event, data)
				},
				util : {
					convertToObjectOfArrays : function(arrayofObjects) {

					},
					convertToArrayOfObjects : function(objectofArrays) {
						var array = [], 
							count = 0;
						
						for (var prop in objectofArrays) 
						{
							var arr = objectofArrays[prop]
							if (arr instanceof Array)
							{
								for (var i=0 ; i<arr.length ; i++)
								{
									if (!array[i])
										array[i] = {}

									array[i][prop] = arr[i]
								}
							}
						}
						return array
					},
					generateID : function() {
						var chars = "1234567890abcdef",
							list = chars.split(""),
							ID = "",
							int, rand;

						for (int=0 ; int<7 ; int++)
						{
							rand = Math.floor(Math.random() * 16);
							ID += list[rand]
						}
						return ID;
					}
				}
			}

		}
	}
}())
