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
	var self, masterIDs, commitIDs, master, commit;

	return {
		init : function() {
			sb.listen({
				'(router)blocks/commit' : this.postDiff
			})
		},
		destroy : function() {
			sb.ignore('(router)blocks/commit')
		},
		postDiff : function(evt) {//outputs should always be right on top
			self = evt.self

			var versions = evt.data;

			master = sb.util.convertToArrayOfObjects(versions.master)
			commit = sb.util.convertToArrayOfObjects(versions.commit)

			masterIDs = evt.data.master.id
			commitIDs = evt.data.commit.id
			var lists = self.diffVersions()
console.log(lists)
			// sb.dispatch('(body:committer)versions/diff/lists/post', lists)			
		},

		diffVersions : function() {
			//lists to send//
			var	lists = {
				created 	: [],
				updated 	: [],
				deleted 	: []
			},
			
			i;

			//push deleted blocks
			for (i=0 ; i<masterIDs.length ; i++) {
				var masterID = masterIDs[i],
					block_is_not_in_commit = (commitIDs.indexOf(masterID) == -1)
				if (block_is_not_in_commit)
					lists.deleted.push(master[i])
			}
			//push created blocks
			for (i=0 ; i<commitIDs.length ; i++)
			{
				var block_was_created = (commitIDs[i] == null)
				if (block_was_created)
					lists.created.push(commit[i])
			}
			//push updated blocks
			for (i=0 ; i<commitIDs.length ; i++)
			{
				var commitID = commitIDs[i],
					mPos 	= masterIDs.indexOf(commitID),
					cPos 	= i,
					cBlock = commit[cPos],
					mBlock = master[mPos];

				if (mBlock && cBlock.id)
				{
					var block_was_changed = (mBlock.content != cBlock.content 
						|| mBlock.sort != cBlock.sort)
				} 
				if (block_was_changed) //something changed: sort or content
					lists.updated.push(commit[cPos])
			}

			return lists
		},
		checkForChanges : function(i) {
			var mID 	= masterIDs[i],
				j 		= commitIDs.indexOf(mID),
				mContent = masterIDs.content[i],
				cContent = commitIDs.content[j],
				changed;

			if (mContent == cContent)
			{
				changed = false
			}
			else
				changed = true

			return {block:commit[j], changed:changed}
		}		

	}
})





CORE.register('body:committer/queries', function(sb) {
	var	self, parent, char,
		created, updated, deleted,
		neo_chunks, sql_chunks;

	return {
		init : function() {
			sb.listen({
				'(neo)currentNodeID/post' : this.cacheParent,
				'(body:committer)versions/diff/lists/post' : this.sendQueries
			})
		},
		destroy : function() {
			sb.ignore('(body:committer)versions/diff/lists/post')
		},
		cacheParent : function(evt) {
			parent = evt.data[0]
		},
		sendQueries : function(evt) {
			self  = evt.self
			var	lists = evt.data,
				q = self.constructQueries(lists);

			// send SQL?
			if (q.sql_insert)
				sb.dispatch('sql/query', {query:q.sql_insert})
			if (q.sql_update)
				sb.dispatch('sql/query', {query:q.sql_update})
			if (q.sql_delete)
				sb.dispatch('sql/query', {query:q.sql_delete})
			// send NEO?
			if (q.neoQ) {
console.log(q.neoQ)				
				sb.dispatch('(neo)query', {query:q.neoQ})
			}
		},
		constructQueries : function(lists) {
			var	neoQ, sql_delete, sql_update, sql_insert, result,
				doitNeo = false;

			updated   = lists.updated
			created   = lists.created
			deleted   = lists.deleted
			if (!parent)
				throw "no parent"

			//construct SQL query
			if (created.length > 0) 
			{
				doitNeo = true
				self.makeIdsForCreated()
				
				sql_insert = self.sqlQuery_insert(created)
			}
			if (updated.length > 0) 
			{
				sql_update = self.sqlQuery_update(updated)
			}
			if (deleted.length > 0) 
			{
				doitNeo = true
				sql_delete = self.sqlQuery_delete(deleted)
			}
			//construct NEO query
			if (doitNeo == true) {
				neoQ = self.neoQuery()
			}

			return {
				neoQ 		: neoQ, 
				sql_delete 	:sql_delete, 
				sql_update 	:sql_update, 
				sql_insert 	: sql_insert
			}


			//notify user of success or failure
			// if (updated.length == 0 && created.length == 0 && deleted.length == 0)
			// 	 result = "no change"
			// else result = "succesfully changed"
			
			// sb.dispatch('(router)respond', result)
		},

		//SQL queries
		sqlQuery_delete : function(deleted) {
			var	query, deleet = [],
				i, id

			for (i=0 ; i<deleted.length ; i++)
			{	
				id = deleted[i].id

				deleet.push('"'+id+'"')
			}

			query = "DELETE FROM blocks WHERE id IN (" + self.stringIt(deleet) + ")"
			return query
		},
		sqlQuery_update : function(updated) {
			var	query, update = "", update_ids = [],
				i, id, content;
			
			for (i=0 ; i<updated.length ; i++)
			{	
				id 		= updated[i].id
				content = updated[i].content
				content = sb.util.escapeSpecials(content)				

				update += 'WHEN "' +id+ '" THEN "' +content+ '" '
				update_ids.push('"'+id+'"')
			}

			query = "UPDATE blocks SET content = CASE id " + update
				+ "END WHERE id IN (" + self.stringIt(update_ids) + ")"
			return query
		},
		sqlQuery_insert : function(created) {
			var	query, insert = [],
				i, id, content;
			
			for (i=0 ; i<created.length ; i++)
			{
				id 		= created[i].id
				content = created[i].content
				content = sb.util.escapeSpecials(content)

				insert.push('("' +id+ '","' +content+ '")')
			}

			query = "INSERT INTO blocks ( id, content ) VALUES " + self.stringIt(insert)				
			return query
		},


		neoQuery : function() {
			char = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

			neo_chunks = {
				match 	: [],
				deleet 	: [],
				create 	: [],
				set	: []
			}
			var parentStr = "(parent:object {id:'"+parent+"'})";
			neo_chunks.match.push(parentStr)
			//grab neo_chunks
			self.neo_sort(updated)
			self.neo_create(created)
			self.neo_delete(deleted)

			//contruct final query from chunks
			var query, 
			match 	= "match " + self.stringIt(neo_chunks.match),
			deleet 	= "",
			create 	= "",
			set 	= "set " + self.stringIt(neo_chunks.set);

			if (deleted.length > 0) {
				deleet = "delete " + self.stringIt(neo_chunks.deleet)
			} 
			if (created.length > 0) {
				create = "create " + self.stringIt(neo_chunks.create)
			}
			
			query = match + deleet + create + set;

			return query
		},	
			neo_sort : function(updated) {
				var	i, id, sort;
				for (i=0 ; i<updated.length ; i++)
				{	
					id 		= updated[i].id,
					sort 	= updated[i].sort;

					neo_chunks.match.push("("+ char[sort-1] + ":block {id:'" +id+ "'})")
					neo_chunks.set.push(char[sort-1] + ".sort=" +sort)
				}
			},
			neo_create : function(created) {
				var	i, sort, id;
				for (i=0 ; i<created.length ; i++)
				{	
					id 	 = created[i].id
					sort = created[i].sort
					neo_chunks.create.push("(parent)-[:contains]->("+ char[sort-1] + ":block {id:'" +id+ "'})")
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
		makeIdsForCreated : function() {
			var i, gen;
			for (i=0 ; i<created.length ; i++)
			{
				gen = sb.util.generateID()
				created[i].id = gen
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
		}
	}
})

