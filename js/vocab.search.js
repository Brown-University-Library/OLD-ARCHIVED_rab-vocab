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
						+ '<li>No results</li>'
					+ '</ul>'
				+ '</div>'},

		stateMap	= {
			$append_target : null,
		},

		jqueryMap = {},

		setJqueryMap, onClickSearch;
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
			$results: $search.find( '.search-results-list' ),
		};
	};
	// End DOM method /setJqueryMap/
	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------

	initModule = function ( $append_target ) {
		$append_target.append( configMap.main_html );
		stateMap.$append_target = $append_target;
		setJqueryMap();
		setPxSizes();

		jqueryMap.$toggle.prop( 'title', configMap.slider_closed_title );
		jqueryMap.$search.click( onClickSearch );
		stateMap.position_type = 'closed';

		return true;
	};

}());