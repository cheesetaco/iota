'use strict'
var	CORE = require('./core.js').CORE;


CORE.register('body:committer', function() {
	return {
		init : function() {
			CORE.start('body:committer/list/diff')
			CORE.start('body:committer/queries')

			//inputs
			//sb.listen('initiator-event', moduleDependencyData)
		},
		destroy: function() {
			CORE.stop('body:committer/list/diff')			
			CORE.stop('body:committer/queries')
		}
	}
})

CORE.register('body:committer/list/diff', function(sb) {
	var self, masterA, commitA, masterO, commitO;

	return {
		init : function() {
			sb.listen({
				'(router)blocks/commit' : this.diffVersions
			})
		},
		destroy : function() {
			sb.ignore('(router)blocks/commit')
		},

		diffVersions : function(evt) {
			self = evt.self
			masterA = evt.data.master
			commitA = evt.data.commit
			masterO = sb.util.convertToArrayOfObjects(masterA)
			commitO = sb.util.convertToArrayOfObjects(commitA)

			//lists to send//
			var	lists = {
				unchanged 	: [],
				created 	: [],
				updated 	: [],
				deleted 	: []
			},
			
			i, id, wasDeleted, update, wasUpdated, wasUnchanged, wasCreated;

			//create lists
			for (i=0 ; i<masterA.id.length ; i++) 
			{
				id 			= masterA.id[i]
				wasDeleted 	= (commitA.id.indexOf(id) == -1)
				update 		= self.checkForChanges(i)
				wasUpdated 	 = (update.changed == true)
				wasUnchanged = (update.changed == false)

				if (wasDeleted) {
					lists.deleted.push(masterO[i])
				}
				else if (wasUpdated) {
					lists.updated.push(update.block)
				}
				else if (wasUnchanged) {
					lists.unchanged.push(update.block)
				}
			}
			for (i=0 ; i<commitA.id.length ; i++)
			{
				wasCreated = (commitA.id[i] == null)

				if (wasCreated)
					lists.created.push(commitO[i])
			}

			sb.dispatch('(body:committer)versions/diff/lists/post', lists)			
		},
		checkForChanges : function(i) {
			var mID 	= masterA.id[i],
				j 		= commitA.id.indexOf(mID),
				mContent = masterA.content[i],
				cContent = commitA.content[j],
				changed;

			if (mContent == cContent)
			{
				changed = false
			}
			else
				changed = true

			return {block:commitO[j], changed:changed}
		}		

	}
})





CORE.register('body:committer/queries', function(sb) {
	var	self, parent, char,
		unchanged, created, updated, deleted,
		neo_chunks;

	return {
		init : function() {
			sb.listen({
				'(neo)currentNodeID/post' : this.cacheParent,
				'(body:committer)versions/diff/lists/post' : this.makeQueries
			})
		},
		destroy : function() {
			sb.ignore('(body:committer)versions/diff/lists/post')
		},
		cacheParent : function(evt) {
			parent = evt.data
		},

		makeQueries : function(evt) {
			self  = evt.self

			var	lists = evt.data,
				neoQ, sqlQ, result;

			unchanged = lists.unchanged 
			updated   = lists.updated
			created   = lists.created
			deleted   = lists.deleted

			if (updated.length == 0 && created.length == 0 && deleted.length == 0)
				result = "no change"
			else {	
				neoQ = self.neoQuery()
				result = neoQ
			}

			sb.dispatch('(router)respond', result)
		},

		neoQuery : function() {
			char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

			neo_chunks = {
				match 	: [],
				deleet 	: [],
				create 	: [],
				set	: []
			};
			//unchanged, updated:
			self.neo_sort(unchanged)
			self.neo_sort(updated)
			//created
			self.neo_create(created)
			//deleted
			self.neo_delete(deleted)

			var query,
				match 	= "match " 	+ self.stringIt(neo_chunks.match),
				deleet 	= "delete " + self.stringIt(neo_chunks.deleet),
				create 	= "create " + self.stringIt(neo_chunks.create),
				set 	= "set " 	+ self.stringIt(neo_chunks.set);
			
			query = match
			if (deleted.length > 0)
				query += deleet
			if (created.length > 0)
				query += create
			query += set

console.log(query)
		},	
			neo_sort : function(list) {
				var	i, id, sort;
				for (i=0 ; i<list.length ; i++)
				{	
					id 		= list[i].id,
					sort 	= list[i].sort;

					neo_chunks.match.push("("+ char[sort-1] + ":block {id:'" +id+ "'})")
					neo_chunks.set.push(char[sort-1] + ".sort=" +sort)
				}
			},
			neo_create : function(created) {
				var	i, genID, sort;
				for (i=0 ; i<created.length ; i++)
				{	
					genID = sb.util.generateID()
					sort  = created[i].sort

					neo_chunks.create.push("(parent)-[:contains]->("+ char[sort-1] + ":block {id:'" +genID+ "'})")
					neo_chunks.set.push(char[sort-1] + ".sort=" +sort)
				}	
			},
			neo_delete : function(deleted) {
				var i, id, sort,
					ditem, ritem,
					dchar = [], rchar = [];
				for (i=0;i<char.length;i++) {
					ditem = "d" + char[i]
					ritem = "r" + char[i]
					dchar.push(ditem)
					rchar.push(ritem)
				}

				for (i=0 ; i<deleted.length ; i++)
				{	
					id 	 = deleted[i].id
					neo_chunks.match.push("(" +dchar[i] + ":block {id:'" +id+ "'})<-[" +rchar[i]+ ":contains]-(parent)")
					neo_chunks.deleet.push(dchar[i] + "," + rchar[i])
				}				
			},
			stringIt : function(chunk) {
				var string = "";

				for (var i=0 ; i<chunk.length ; i++)
				{
					string += chunk[i]
					
					if (i == chunk.length-1)
						string += " "
					else
						string += ", "
				}
				return string
			},		
	}
})

