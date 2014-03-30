'use strict'
var	CORE = require('./core.js').CORE;


CORE.register('body:committer', function() {
	return {
		init : function() {
			CORE.start('body:committer/list/diff')
			CORE.start('body:committer/queries')
		},
		destroy: function() {
			CORE.stop('body:committer/list/diff')			
			CORE.stop('body:committer/queries')
		}
	}
})

CORE.register('body:committer/list/diff', function(sb) {
	var self, parent, masterA, commitA, masterO, commitO;

	return {
		init : function() {
			sb.listen({
				'(neo)currentNodeID/post' : this.cacheParent,
				'(router)blocks/commit' : this.diffVersions
			})
		},
		destroy : function() {
			sb.ignore('(router)blocks/commit')
		},
		cacheParent : function(evt) {
			parent = evt.data
		},
		diffVersions : function(evt) {
			self = evt.self
			masterA = evt.data.master
			commitA = evt.data.commit
			masterO = sb.convertToArrayOfObjects(masterA)
			commitO = sb.convertToArrayOfObjects(commitA)

			//lists to send//
			var	lists = {
				unchanged 	: [],
				created 	: [],
				updated 	: [],
				deleted 	: []
			},
			
			i, id, wasDeleted, update, wasUpdated, wasUnchanged, wasCreated;

			//create lists
			for (i=0 ; i<masterA.ids.length ; i++) 
			{
				id 			= masterA.ids[i]
				wasDeleted 	= (commitA.ids.indexOf(id) == -1)
				update 		= self.checkForChanges(i)
				wasUpdated 	 = (update.changed == true)
				wasUnchanged = (update.changed == false)

				if (wasDeleted) {
					lists.deleted.push(master[i])
				}
				else if (wasUpdated) {
					lists.updated.push(update.block)
				}
				else if (wasUnchanged) {
					lists.unchanged.push(update.block)
				}
			}
			for (i=0 ; i<commitA.ids.length ; i++)
			{
				wasCreated = (commitA.ids[i] == null)

				if (wasCreated)
					lists.created.push(commitO[i])
			}

console.log(lists)
			sb.dispatch('(body:committer)versions/diff/lists/post', lists)			
		},
		checkForChanges : function(i) {
			var mID 	= masterA.ids[i],
				j 		= commitA.ids.indexOf(mID),
				mContent = masterA.blocks[i],
				cContent = commitA.blocks[j],
				changed;
console.log(mContent)
console.log(cContent)
			if (mContent == cContent)
			{
console.log('false')
				changed = false
			}
			else
				changed = true

			return {block:commitO[j], changed:changed}
		}		

	}
})





// CORE.register('body:committer/queries', function(sb) {
// 	var commit, master;

// 	return {
// 		init : function() {
// 			sb.listen({
// 				'(router)blocks/commit' : this.cacheVersions,
// 				'(body:committer)versions/diff/lists/post' : this.makeQueries
// 			})
// 		},
// 		destroy : function() {
// 			sb.ignore('(router)blocks/commit')
// 		},
// 		cacheVersions : function(evt) {
// 			var data = JSON.parse(evt.data)
// 			master = data.master
// 			commit = data.commit
// 		},

// 		makeQueries : function(evt) {
// 			var self  = evt.self,
// 				lists = evt.data,
// 				neo, sql;
			
// 			neo = self.neoQuery(lists)

// 			sb.dispatch('(router)respond', lists)
// 		},

// 		neoQuery : function(lists) {
// 			var	updated = lists.updated,
// 				deleted = lists.deleted,
			
// 			neo_chunks = {
// 				match 	: "",
// 				update 	: "",	
// 				delet 	: "",
// 				create 	: "",
// 				sort	: ""
// 			};
// 			//construct neo_chunks from blocks
// 			for (i=0 ; i<updated.length ; i++)
// 			{
// 				var block = {
// 					content : updated.blocks[i],
// 					id 		: updated.ids[i]
// 				},
// 				//grab chunk(s)
// 				chunk = self.neo_chunk(block)

// 				//append chunk(s)
// 				for (attr in chunk) {
// 					console.log(attr)
// 				}
// 			}


// 			return neo
// 		},
// 		neo_chunk : function(block) {
// 			var char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
// 			match, update, delet, create, sort;
			
// 			if (block.id)
// 				match = "("+ char[i] + ":block {id:'" +id+ "'}), "
// 			else //see if block has changed
// 				self.checkForChanges(master[i])
			
// 			return {
// 				match 	: match,
// 				update 	: update,	
// 				delet 	: delet,
// 				create 	: create,
// 				sort	: sort
// 			}
// 		},

// 	}
// })

