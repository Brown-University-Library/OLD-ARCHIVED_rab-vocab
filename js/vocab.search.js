vocab.search = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
		configMap = {
			main_html : String()
				+ '<div class="search">'
			 		+ '<div class="row">'
				 		+ '<input class="search-input" type="text" />'
				 		+ '<button type="button" class="search-submit btn btn-success">Search</button>'
					+ '</div>'
					+ '<ul class="search-results-list list-group row">'
						+ '<div class="col-sm-4" data-column="0">'
							+ '<li class="list-group-item" data-search-result="0" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="1" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="2" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="3" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="4" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="5" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="6" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="7" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="8" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="9" data-rabid=""></li>'
						+ '</div>'
						+ '<div class="col-sm-4" data-column="1">'
							+ '<li class="list-group-item" data-search-result="10" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="11" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="12" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="13" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="14" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="15" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="16" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="17" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="18" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="19" data-rabid=""></li>'
						+ '</div>'
						+ '<div class="col-sm-4" data-column="2">'
							+ '<li class="list-group-item" data-search-result="20" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="21" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="22" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="23" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="24" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="25" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="26" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="27" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="28" data-rabid=""></li>'
							+ '<li class="list-group-item" data-search-result="29" data-rabid=""></li>'
						+ '</div>'
					+ '</ul>'
				+ '</div>',
			terms_model : null
		},

		stateMap	= {
			$append_target : null,
			search_results : [],
			results_page : 0
		},

		jqueryMap = {},

		updateResultsList, onClickSearch, displayResultsPage,
		setJqueryMap, initModule, configModule;
	//----------------- END MODULE SCOPE VARIABLES ---------------

	//--------------------- BEGIN DOM METHODS --------------------
	// Begin DOM method /setJqueryMap/
	setJqueryMap = function () {
		var
			$append_target = stateMap.$append_target;
			$search = $append_target.find( '.search' );

		jqueryMap = {
			$search : $search,
			$input : $search.find( '.search-input input[type=text]' ),
			$submit: $search.find( '.search-submit' ),
			$results: $search.find( '.search-results-list li' ),
		};
	};
	// End DOM method /setJqueryMap/
	updateResultsList = function () {
		stateMap.search_results = configMap.terms_model.get_items();
		stateMap.results_page = 0;
		displayResultsPage();		
	};

	displayResultsPage = function () {
		var
			i, page,
			paged_results = [],
			results_length = stateMap.search_results.length,
			cols_for_page = 3,
			rows_for_col = 10;

		i = 0;
		while ( i < results_length ) {
			paged_results.push(
				stateMap.search_results.slice(
					i, i += rows_for_col * cols_for_page));
		}

		page = paged_results[ stateMap.results_page ];
		i = 0;
		while ( i < page.length ) {
			var $result = jqueryMap.$results.eq(i);
			$result.append(page[i].label);
			$result.attr('data-rabid', page[i].id);
			i++;
		}
	};
	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------
	onClickSearch = function () {
		var query = $('.search-input').val();
		$( window ).trigger('termsearch', query);
	};

	//-------------------- END EVENT HANDLERS --------------------

	configModule = function ( map ) {
		configMap.terms_model = map.terms_model;
	};

	initModule = function ( $append_target ) {
		$append_target.append( configMap.main_html );
		stateMap.$append_target = $append_target;
		setJqueryMap();

		jqueryMap.$submit.click( onClickSearch );

		$( window ).on('modelUpdate', function(e) {
			updateResultsList();
		})

		return true;
	};

	return {
		configModule		: configModule,
		initModule			: initModule
	};
}());