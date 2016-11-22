vocab.model = (function () {
	var

		configMap = {
			resource_base : "http://vivo.brown.edu/individual/"
		},

		stateMap  = {
			inspecting		: false,
			editing			: false
		},

		terms,

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
			
			console.log(term_data);
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

	terms = (function () {
		var
			search;

		search = function ( termQuery ) {
			vocab.data.solr.search( termQuery, function ( resp ) {
					var matches;
					searchDataUpdate( resp, termQuery );
					$( window ).trigger('searchComplete', termQuery );
			});
		};

		get_search_matches = function ( termQuery ) {
			var
				matches, results, term;

			matches = search_db().get({ query : termQuery });

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

		describe = function ( rabid ) {
			var linked_attributes;

			linked_attributes = ['broader','narrower','related'];
			vocab.data.rest.describe( rabid, linked_attributes, function( resp ) {
				termDataUpdate( resp );
				$( window ).trigger('termDescribed', rabid);
			});
		};

		return {
			search : search,
			get_search_matches : get_search_matches,
			describe : describe
		}
	}());

	onModelUpdate = function ( evt ) {
		$( window ).trigger(evt);
	} ;

	initModule = function () {
  		// $( window ).on('termSearch', function(e, query) {
  		// 	terms.clear();
  		// 	vocab.data.solr.search(query, createMany);
  		// });
  		$( window ).on('inspectTerm', function(e, rabid) {
  			stateMap.inspecting = true;
  			terms.inspect(rabid);
  		});
  		$( window ).on('editTerm', function(e, rabid) {
  			var term;
  			stateMap.editing = true;
  			vocab.data.rest.find(rabid, updateTerm)
  			.then( function ( resp ) {
  				makeEditable( resp );
  			})
  			.then (function ( resp ) {
  				onModelUpdate('termEditable');
  			});
  		});
	  	$( window ).on('submitTermUpdate', function(e, data){
  			terms.overwrite(data);
  		});
 	 };

	return {
		initModule : initModule,
		terms : terms,
		terms_db : terms_db
	};
}());