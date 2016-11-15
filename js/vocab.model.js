vocab.model = (function () {
	var
		stateMap  = {
			inspected_term	: null,
			editable_term	: null,
		 	term_stack		: [],
			terms_by_uri	: {},
			terms_by_id		: {},
			terms_by_label	: {},
			inspecting		: false,
			editing			: false
		},

		terms, makeTerm, termProto,
		resetModel,
		createTerm, updateTerm, deleteTerm,
		createMany, makeEditable,
		onModelUpdate, initModule;

	termProto = {
		etag : null,
		editing : false,
		inspecting : false,
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

	resetModel = function () {
		stateMap  = {
			inspected_term	: null,
			editable_term	: null,
		 	term_stack		: [],
			terms_by_uri	: {},
			terms_by_id		: {},
			terms_by_label	: {},
			inspecting		: false,
			editing			: false
		};

		onModelUpdate('resetModel');
	};

	createTerm = function ( term_data ) {
		var idx, attr, term;
		
		term = Object.create( termProto );
		for ( attr in term ) {
			if ( attr in term_data ) {
				term[ attr ] = term_data[ attr ];
			}
		}
		stateMap.term_stack.push(term);
		idx = stateMap.term_stack.length - 1;
		stateMap.terms_by_uri[ term.uri ] = idx;
		stateMap.terms_by_id[ term.rabid ] = idx;
		stateMap.terms_by_label[ term.label ] = idx;

		return term;
	};

	updateTerm = function ( updated ) {
		var attr, idx, to_update;

		if ( updated.uri in stateMap.terms_by_uri ) {
			idx = stateMap.terms_by_uri[ updated.uri ];
			to_update = stateMap.term_stack[ idx ];

			for ( attr in to_update ) {
				if ( attr in updated ) {
					stateMap.term_stack[ idx ][ attr ] = updated[ attr ];
				}
			}

			return stateMap.term_stack[ idx ];
		}
		else {
			createTerm( updated );
		}
	};

	deleteTerm = function ( term ) {
		var existing;

		if ( term.uri in stateMap.terms_by_uri ) {
				existing = stateMap.terms_by_uri[term.uri];
	  			delete stateMap.terms_by_uri[ existing.uri ];
	  			delete stateMap.terms_by_id[ existing.id ];
	  			delete stateMap.terms_by_label[ existing.label ];
	  			return true;
		}
		else {
			return false;
		}
	};

	createMany = function ( objList ) {
		var i, res;

		for (i=0; i < objList.length; i++) {
			res = createTerm(objList[ i ]);
		}

		onModelUpdate('termsCreated');
	};

	makeEditable = function ( resp ) {
		var idx, uri;
		uri	= Object.keys(resp)[0];
		idx = stateMap.terms_by_uri[ uri ];
		stateMap.term_stack[ idx ].editing = true;

		return resp;
	};

	terms = (function () {
		var
			getTermByRabid,
			create,
			setInspectedTerm, get_inspected,
			get_items, clear, inspect, onInspect,
			get_by_id, get_by_uri, get_by_name,
			edit, onEdit, get_editable;

		clear = function () {
			var i, len, term;
			for ( i = 0, len = stateMap.term_stack.length; i < len; i++ ) {
				term  = stateMap.term_stack[ i ];
				if ( term.editing === false ) {
					deleteTerm(term);
				}
			}
			stateMap.term_stack = [];
		};

		getTerm = function ( rabid ) {
			vocab.data.rest.find(rabid)

		};

		inspect = function ( rabid ) {
			vocab.data.rest.find(rabid, onInspect);
		};

		onInspect = function ( servData ) {
			term = makeTerm(servData);
			stateMap.inspected_term = term;
			$( window ).trigger('termInspected');			
		};

		edit = function ( rabid ) {
			vocab.data.rest.find(rabid, onEdit);
		};

		overwrite =  function ( data ) {
  			var updated;

  			updated = updateTerm(data);
  			vocab.data.rest.update(updated, resetModel);
		};

		onEdit = function ( resp ) {
			var editable;

			editable = makeEditable(resp);
			$( window ).trigger('termEditable', editable);			
		};

		get_by_rabid = function ( id ) {
			return stateMap.term_stack[ stateMap.terms_by_id[ id ] ];
		};

		get_by_uri = function ( uri ) {
			return stateMap.term_stack[ stateMap.terms_by_uri[ uri ] ];
		};

		get_by_name = function ( label ) {
			return stateMap.term_stack[ stateMap.terms_by_label[ label ] ];
		};

		get_items = function () {
			return stateMap.term_stack;
		};

		get_inspected = function () {
			return stateMap.inspected_term;
		}

		get_editable = function () {
			var i;
			
			for (i = 0; i < stateMap.term_stack.length; i++ ) {
				if (stateMap.term_stack[i].editing === true) {
					return stateMap.term_stack[i];
				}
			} 

			return false;
		}

		getTermByRabid = function ( rabid ) {
			vocab.data.rest.find( rabid, function ( rabid ) {
				$( window ).trigger("termFound", rabid);
			});
		}

		return {
			clear : clear,
			get_by_rabid : get_by_rabid,
			get_by_uri : get_by_uri,
			get_by_name : get_by_name,
			get_items : get_items,
			setInspectedTerm : setInspectedTerm,
			get_inspected : get_inspected,
			get_editable : get_editable,
			inspect : inspect,
			edit : edit,
			overwrite : overwrite,
			create : create,
			getTermByRabid : getTermByRabid
		}
	}());

	onModelUpdate = function ( evt ) {
		$( window ).trigger(evt);
	} ;

	initModule = function () {
  		$( window ).on('termSearch', function(e, query) {
  			terms.clear();
  			vocab.data.solr.search(query, createMany);
  		});
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
		updateTerm : updateTerm
	};
}());