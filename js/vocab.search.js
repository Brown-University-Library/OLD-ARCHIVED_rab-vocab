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
						+ '<li data-uri="0">No results</li>'
					+ '</ul>'
				+ '</div>',
			terms_model : null
		},

		stateMap	= {
			$append_target : null,
		},

		jqueryMap = {},

		updateResultsList, onClickSearch,
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
			$results: $search.find( '.search-results-list' ),
		};
	};
	// End DOM method /setJqueryMap/
	updateResultsList = function () {
		var
			list_items = [],
			results_list = configMap.terms_model.get_items();

		for (var i = 0, len = results_list.length; i < len; i++) {
			var
				result = results_list[i];
				$list_item = $("<li>");
			$list_item.data("uri", result.uri);
			$list_item.text(result.label);
			$list_item.addClass("list-group-item");

			list_items.push($list_item);
		}

		jqueryMap.$results.empty();

		if (list_items.length > 0) {
			var chunked;

			chunked = vocab.utils.chunkify(list_items, 10, false);
			
			for (var i = 0, len = chunked.length; i < len; i++ ) {
				var
					li_list = chunked[i],
					$column = $("<div>");
				$column.addClass("col-sm-4");
				
				for (var i = 0, len = li_list.length; i < len; i++ ) {
					$column.append(li_list[i]);
				}
				jqueryMap.$results.append($column);
			}
		}
		else {
			var $no_results = $('<li>', {'data-uri': 0})
			jqueryMap.$results.append($no_results);
		}
	}
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