vocab.model = (function () {
	var
    stateMap  = {
      term_stack			: [],
      terms_by_uri		: {},
      terms_by_id			: {},
      terms_by_label	: {}
    },

		terms, makeTerm, termProto, initModule;

	termProto = {
		uri : null,
		id : null,
		label : null,
		broader : [],
		narrower : [],
		related : [],
		hidden : [],
		alternative : []
	};	

	makeTerm = function ( term_map ) {
		var
			term = Object.create( termProto );

		term = vocab.utils.mergeMaps(term, term_map);
		stateMap.term_stack.push(term);
		idx = stateMap.term_stack.length - 1;
		stateMap.terms_by_uri[ term.uri ] = idx;
		stateMap.terms_by_id[ term.id ] = idx;
		stateMap.terms_by_label[ term.label ] = idx;
	};

	terms = (function () {
		var
			updateTerms, get_items, clearTerms,
			get_by_id, get_by_uri, get_by_name;

		clearTerms = function () {
			stateMap.term_stack = [];
		};

		updateTerms = function ( jsonArray ) {
			var i, len;
			for ( i = 0, len = jsonArray.length; i < len; i++ ) {
				makeTerm(jsonArray[i]);
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

		return {
			clearTerms : clearTerms,
			updateTerms : updateTerms,
			get_by_id : get_by_id,
			get_by_uri : get_by_uri,
			get_by_name : get_by_name,
			get_items : get_items
		}
	}());

  initModule = function () {
  	$( window ).on('solrUpdate', function(e, data){
  		terms.clearTerms();
  		terms.updateTerms(data.data);
  	});
  	$( window ).on('termsearch', function(e, query) {
  		vocab.data.solr.search(query);
  	})
  };

  return {
    initModule : initModule,
    terms : terms
  };
}());