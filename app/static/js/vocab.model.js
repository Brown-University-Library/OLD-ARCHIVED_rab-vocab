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
		
		dataDifference,
		addInverseAttrs, removeInverseAttrs,
		resetData,

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

	dataDifference = function ( newData, oldData ) {
		var 
			addData = [],
			removeData = [];

		for ( var key in newData ) {
			if ( key in oldData ) {
				var newArr = newData[key];
				var oldArr = oldData[key];

				newArr.forEach( function( uri ) {
					if (oldArr.indexOf( uri ) < 0) {
						addData.push( { 'attr': key, 'uri': uri } );
					}
				});

				oldArr.forEach( function( uri ) {
					if (newArr.indexOf( uri ) < 0) {
						removeData.push( { 'attr': key, 'uri': uri } );
					}
				});
			}
		}

		return { 'add': addData, 'remove': removeData };
	};

	addInverseAttrs = function ( addData, rabid ) {

		var
		  out = [],
		  editing = {};

		addData.forEach( function( obj ) {
			var inv;

			if ( !( obj.uri in editing ) ) {
				inv = terms_db({ uri : obj.uri }).first();
				inv.data['label'] = [ inv.label ];
				editing[ obj.uri ] = inv;
			} else {
				inv = editing[ obj.uri ];
			}
			

			if ( obj.attr === 'broader' ) {
				inv.data['narrower'].push(rabid);
			} else if ( obj.attr === 'narrower' ) {
				inv.data['broader'].push(rabid);
			} else if ( obj.attr === 'related' ) {
				inv.data['related'].push(rabid);
			} else {
				console.log( 'trouble', obj );
				return;
			}
		});

		for ( var uri in editing ) {
			if ( 'rabid' in editing[uri] ) {
				out.push( editing[uri] );
			}
		}

		return out;
	};

	removeInverseAttrs = function ( rmvData, rabid ) {

		var
		  out = [],
		  editing = {};

		rmvData.forEach( function( obj ) {
			var inv;

			if ( !( obj.uri in editing ) ) {
				inv = terms_db({ uri : obj.uri }).first();
				inv.data['label'] = [ inv.label ];
				editing[ obj.uri ] = inv;
			} else {
				inv = editing[ obj.uri ];
			}
			

			if ( obj.attr === 'broader' ) {
				var idx = inv.data['narrower'].indexOf(rabid);
				inv.data['narrower'].splice(idx, 1);
			} else if ( obj.attr === 'narrower' ) {
				var idx = inv.data['broader'].indexOf(rabid);
				inv.data['broader'].splice(idx, 1);
			} else if ( obj.attr === 'related' ) {
				var idx = inv.data['related'].indexOf(rabid);
				inv.data['related'].splice(idx, 1);
			} else {
				console.log( 'trouble', obj );
				return;
			}
		});

		for ( var uri in editing ) {
			if ( 'rabid' in editing[uri] ) {
				out.push( editing[uri] );
			}
		}

		return out;
	};

	resetData = function () {
		terms_db = TAFFY();
		search_db = TAFFY();
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
		var
		  existing, diff,
		  add_inverse, del_inverse,
		  out;

		existing = terms_db({ rabid : rabid }).first();

		diff = dataDifference( update.data, existing.data );

		add_inverse = addInverseAttrs( diff.add, existing.uri );
		del_inverse = removeInverseAttrs( diff.remove, existing.uri );

		update.uri = existing.uri;
		update.rabid = existing.rabid;
		update.data['label'] = [ update.label ];

		out = add_inverse.concat(del_inverse)
		out.push(update);

		terms_db({ rabid : existing.rabid }).update({ editing : false});

		vocab.data.rest.update( out, function( resp ) {
			resetData();
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
