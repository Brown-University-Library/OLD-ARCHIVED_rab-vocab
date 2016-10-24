vocab.model = (function () {
	var
    stateMap  = {
    	inspected_term	: null,
      term_stack			: [],
      terms_by_uri		: {},
      terms_by_id			: {},
      terms_by_label	: {},
      inspecting			: false,
      editing					: false
    },

		terms, makeTerm, termProto, initModule;

	termProto = {
		uri : null,
		id : null,
		label : null,
		data : {
			broader : [],
			narrower : [],
			related : [],
			hidden : [],
			alternative : []
		}
	};	

	makeTerm = function ( term_map ) {
		var
			term = Object.create( termProto );

		term = vocab.utils.mergeMaps(term, term_map);
		return term;
	};

	indexTerm = function (term) {
		var existing, idx;

		if ( term.uri in stateMap.terms_by_uri ) {
			existing = stateMap.terms_by_uri[term.uri];
  		stateMap.term_stack.splice(existing, 1);
		}

		stateMap.term_stack.push(term);
		idx = stateMap.term_stack.length - 1;
		stateMap.terms_by_uri[ term.uri ] = idx;
		stateMap.terms_by_id[ term.id ] = idx;
		stateMap.terms_by_label[ term.label ] = idx;
	}

	terms = (function () {
		var
			setInspectedTerm, get_inspected,
			updateTerms, get_items, clearTerms,
			updateTerm,
			get_by_id, get_by_uri, get_by_name;

		setInspectedTerm = function ( jdata ) {
			var
				idx, term, key, vals;

			jdata.label = jdata.label[0];
			term = makeTerm(jdata);
			
			for (key in term.data) {
				if (term.data.hasOwnProperty(key)) {
					vals = term.data[key];
					for (var i = 0, len=vals.length; i < len; i++) {
						$result_list.append('<li>'+vals[i]+'</li>');
					}
				}
			}

			stateMap.inspected_term = term;
			$( window ).trigger('termInspected');

			return true;
		};

		clearTerms = function () {
			stateMap.term_stack = [];
		};

		getInspection = function ( rabid ) {
			vocab.data.rest.find(rabid)

		};

		updateTerm = function ( servData ) {
			var
				term, existing;

			if (servData.uri in stateMap.terms_by_uri ) {
				existing = stateMap.terms_by_uri[term.uri];
	  		stateMap.term_stack.splice(existing, 1);
			}

			term = makeTerm(servData);
			indexTerm(term);
		};

		updateTerms = function ( jsonArray ) {
			var i, len;
			for ( i = 0, len = jsonArray.length; i < len; i++ ) {
				term = makeTerm(jsonArray[i]);
				indexTerm(term);
			}

			$( window ).trigger('modelUpdate');
		};

		get_by_id = function ( id ) {
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

		return {
			clearTerms : clearTerms,
			updateTerms : updateTerms,
			get_by_id : get_by_id,
			get_by_uri : get_by_uri,
			get_by_name : get_by_name,
			get_items : get_items,
			setInspectedTerm : setInspectedTerm,
			get_inspected : get_inspected,
			updateTerm : updateTerm
		}
	}());

  initModule = function () {
  	$( window ).on('solrUpdate', function(e, data){
  		terms.clearTerms();
  		terms.updateTerms(data.data);
  	});
  	$( window ).on('termsearch', function(e, query) {
  		vocab.data.solr.search(query);
  	});
  	$( window ).on('inspectTerm', function(e, rabid) {
  		stateMap.inspecting = true;
  		vocab.data.rest.find(rabid);
  	});
  	$( window ).on('restFind', function(e, data){
  		if (stateMap.inspecting === true) {
  			terms.setInspectedTerm(data.data);
  			stateMap.inspecting = false;
  	}
  	});
  };

  return {
    initModule : initModule,
    terms : terms
  };
}());