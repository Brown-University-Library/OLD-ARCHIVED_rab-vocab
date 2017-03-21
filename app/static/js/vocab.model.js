vocab.model = (function () {
	var

		configMap = {
			resource_base : "http://vivo.brown.edu/individual/"
		},

		stateMap  = {
			inspecting		: false,
			editing			: false
		},

		terms, search_terms,
		describe_term, update_term,

		terms_db, termProto,
		makeTerm, termDataUpdate,
		
		search_db, searchProto,
		makeSearchResult, searchDataUpdate,
		
		initModule;

	terms_db = TAFFY();
	termProto = {
		editing : false,
		uri : null,
		rabid : null,
		label : null,
		data : {
			broader : [],
			narrower : [],
			related : [],
			hidden : [],
			alternative : []
		}
	};

	makeTerm = function ( term_data ) {
		var term, key, existing;

		term = Object.create( termProto );

		term.uri = term_data.uri;
		term.rabid = term_data.id;
		term.label = term_data.display;
		term.editing = false;
		term.data = {
			broader : [],
			narrower : [],
			related : [],
			hidden : [],
			alternative : []
		};
		for ( key in term.data ) {
			if ( key in term_data.data ) {
				term.data[key] = term_data.data[key];
			}
		}
		
		terms_db.insert( term );
		return terms_db({ rabid: term.rabid }).first();
	};

	termDataUpdate = function ( dataArray ) {

		dataArray.forEach( function( term_data ) {
			var term, existing_term;

			existing_term = terms_db({ uri : term_data.uri }).first();
			if ( existing_term !== false ) {
				if ( existing_term.editing === false ) {
					terms_db({ uri : existing_term.uri }).remove();
				}
				else {
					return;
				}
			}
			term = makeTerm(term_data);				
		});

		return true;
	};

	search_db = TAFFY();
	searchProto = {
		query : null,
		uri : null
	};

	makeSearchResult = function ( result_data ) {
		var match;

		match = Object.create( searchProto );

		match.query = result_data.query;
		match.uri = result_data.uri;

		search_db.insert(match);

		return search_db( { query: match.query },{ uri: match.uri } ).first();
	};

	searchDataUpdate = function ( dataArray, searchTerm ) {

		dataArray.forEach( function( term_data ) {
			var new_term, existing_term,
				new_search_result, existing_match;
			
			existing_term = terms_db({ uri : term_data.uri }).first();
			if ( existing_term === false ) {
				new_term = makeTerm(term_data);
			}
			existing_match = search_db({ query : searchTerm },{ uri : term_data.uri }).first();
			if ( existing_match === false ) {
				new_search_result = makeSearchResult({ query: searchTerm, uri: term_data.uri });
			}
		});

		return true;
	};

	search_terms = function ( termQuery ) {
		vocab.data.solr.search( termQuery, function ( resp ) {
				var matches;
				searchDataUpdate( resp, termQuery );
				$( window ).trigger('searchComplete', termQuery );
		});
	};

	describe_term = function ( rabid ) {
		vocab.data.rest.describe( rabid, function( resp ) {
			termDataUpdate( resp );
			$( window ).trigger('termDescribed', rabid);
		});
	};

	update_term = function ( rabid, update ) {
		var existing, attr;

		existing = terms_db({ rabid : rabid }).first();

		update.uri = existing.uri;
		update.rabid = existing.rabid;
		update.etag = existing.etag;

		terms_db({ rabid : existing.rabid }).update({ editing : false});

		vocab.data.rest.update( update, function( resp ) {
			termDataUpdate( resp );
			$( window ).trigger('termUpdated', rabid);
		});
	};

	terms = (function () {
		var
			get_term, search_matches,
			set_term_editing,
			reset_term_editing;

		get_term = function ( paramObj ) {
			var term;

			term = terms_db( paramObj ).first();
			return term;
		};

		search_matches = function ( termQuery ) {
			var
				matches, results, term;

				matches = search_db({ query : termQuery }).get();

				results = [];
				if ( matches.length > 0) {
					matches.forEach( function( match ) {
						term = terms_db({ uri : match.uri }).first();
						results.push( term );
					});
					return results;
				}
				else {
					return results;
				}
		};

		set_term_editing = function ( paramObj ) {
			term = terms_db( paramObj ).update( { editing : true } );
		};

		reset_term_editing = function () {
			term = terms_db().update( { editing : false } );
		};

		return {
			get_term : get_term,
			search_matches : search_matches,
			set_term_editing : set_term_editing,
			reset_term_editing : reset_term_editing
		}
	}());

	initModule = function () {};

	return {
		initModule : initModule,
		terms : terms,
		terms_db : terms_db,
		search_db : search_db,
		search_terms : search_terms,
		describe_term : describe_term,
		update_term : update_term
	};
}());
