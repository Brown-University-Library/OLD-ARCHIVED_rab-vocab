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
		describe_term,

		terms_db, termProto,
		makeTerm, termDataUpdate,
		
		search_db, searchProto,
		makeSearchResult, searchDataUpdate,
		
		initModule;

	terms_db = TAFFY();
	termProto = {
		editing : false,
		uri : null,
		etag : null,
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
		term.rabid = term.uri.substring(configMap.resource_base.length);
		term.label = term_data.label[0];
		term.etag = term_data.etag;
		term.editing = false;
		term.data = {
			broader : [],
			narrower : [],
			related : [],
			hidden : [],
			alternative : []
		};
		for ( key in term.data ) {
			if ( key in term_data ) {
				term.data[key] = term_data[key];
			}
		}
		
		terms_db.insert( term );
		return terms_db({ rabid: term.rabid }).first();
	};

	termDataUpdate = function ( dataArray ) {
		var
			term_data, term,
			existing_term, key;

		dataArray.forEach( function( serv_data ) {
			term_data = serv_data.data;
			term_data.uri = serv_data.uri;
			term_data.etag = serv_data.etag;
			
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
		var term_data, term, existing_term,
				search_result, existing_match;

		dataArray.forEach( function( serv_data ) {
			term_data = serv_data.data;
			term_data.uri = serv_data.uri;
			
			existing_term = terms_db({ uri : term_data.uri }).first();
			if ( existing_term !== false ) {
				return;
			}
			else {
				term = makeTerm(term_data);				
			}

			existing_match = search_db({ query : searchTerm },{ uri : term_data.uri }).first();
			if ( existing_match !== false ) {
				return;
			}
			search_result = makeSearchResult({ query: searchTerm, uri: term.uri });
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
		var linked_attributes;

		linked_attributes = ['broader','narrower','related'];
		vocab.data.rest.describe( rabid, linked_attributes, function( resp ) {
			termDataUpdate( resp );
			$( window ).trigger('termDescribed', rabid);
		});
	};

	terms = (function () {
		var
			get_term, search_matches,
			set_term_editing;

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

		return {
			get_term : get_term,
			search_matches : search_matches,
			set_term_editing : set_term_editing
		}
	}());

	initModule = function () {};

	return {
		initModule : initModule,
		terms : terms,
		terms_db : terms_db,
		search_db : search_db,
		search_terms : search_terms,
		describe_term : describe_term
	};
}());