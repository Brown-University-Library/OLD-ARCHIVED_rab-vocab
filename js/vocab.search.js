vocab.search = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
		configMap = {
			main_html : String()
				+ '<div class="search ui-widget">'
			 		+ '<div class="search-ctrl ui-widget-header">'
				 		+ '<input class="search-input ui-autocomplete-input" type="text" />'
				 		+ '<button type="button" class="search-submit ui-button">Search</button>'
				 		+ '<button type="button" class="search-reset ui-button">Reset</button>'
					+ '</div>'
					+ '<div class="search-results">'
						+ '<ul class="search-results-tabs">'
						+ '</ul>'
					+ '</div>'
				+ '</div>',
			terms_model : null,
			results_total : 72,
			cols_for_page : 3,
			rows_for_col : 8
		},

		stateMap	= {
			$append_target : null,
			search_results : []
		},

		jqueryMap = {},
		
		makeDraggable,
		enableEditControls,
		onClickSearch, onClickReset,
		onClickDetails,

		initializeResultsList, bindDataToLi,

		doSearch, showSearchResults,
		clearSearchResults, updateSearchResults,
		toggleSearchResultsInspect, toggleSearchResultsDrag,
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
			$input : $search.find( '.search-input' ),
			$submit: $search.find( '.search-submit' ),
			$reset: $search.find('.search-reset'),
			$details: $search.find( '.search-results-item-details'),
			$edit: $search.find( '.edit'),
			$results: $search.find( '.search-results-item' )
		};
	};
	// End DOM method /setJqueryMap/
	initializeResultsList = function () {
		var $results,
			li_count, li_array,
			$li, $li_slice,
			$details_button,
			col_total, col_count,
			col_array, $col, $col_slice,
			page_total, page_count, $page,
			$tabs_list, $tab, $tab_link;
		
		$results = stateMap.$append_target.find('.search-results');
		$tabs_list = stateMap.$append_target.find('.search-results-tabs');

		li_array = [];
		li_count = 0;
		while ( li_count < configMap.results_total ) {
			$li = $('<li/>', {	'class'		: 'search-results-item',
								'data-index': li_count,
								'data-rabid': '',
								'data-uri'	: ''});
			$li.append('<span class="search-results-item-label"></span>')
			$details_button = $('<button/>', {	'type': 'button',
												'class' : 'search-results-item-details ui-button'
											});
			$details_button.append('<span class="ui-icon ui-icon-search"></span>');
			$li.append($details_button);

			li_array.push($li);
			li_count++;
		};

		col_total = Math.ceil(
			configMap.results_total / configMap.rows_for_col );
		col_array = [];
		col_count = 0;
		while ( col_count < col_total ) {
			$col = $('<ul/>', {	'class': 'search-results-col',
									'data-index': col_count });
			$li_slice = li_array.slice(
				(col_count * configMap.rows_for_col) ,
				(( col_count + 1 ) * configMap.rows_for_col)
				)
			$($li_slice).each( function() {
				$col.append($(this));
			});

			col_array.push($col);
			col_count++;
		}

		page_total = Math.ceil(
			configMap.results_total / ( configMap.cols_for_page * configMap.rows_for_col ));
		page_count = 0;
		while ( page_count < page_total ) {
			$tab = $('<li/>');
			$tab_link = $('<a/>', { 'href': '#results-page-' + page_count })
			$tab_link.text( '' 
				+ ( ( page_count * configMap.cols_for_page * configMap.rows_for_col ) + 1 )
				+ '-'
				+ ( ( page_count + 1) * configMap.cols_for_page * configMap.rows_for_col )
			);
			$tab.append( $tab_link );
			$tabs_list.append($tab);

			$page = $('<div/>', {	'id': 'results-page-' + page_count });
			$col_slice = col_array.slice(
				( page_count * configMap.cols_for_page ) ,
				(( page_count + 1 ) * configMap.cols_for_page )
				)
			$($col_slice).each( function() {
				$page.append($(this));
			});
			 
			$results.append($page);
			page_count++;
		}

		$results.tabs();
	};

	bindDataToLi = function ( dataObj, $li ) {
		var $label;

		$label = $li.find('.search-results-item-label');
		
		$li.attr('data-rabid', dataObj.rabid);
		$li.attr('data-uri', dataObj.uri);
		$label.text(dataObj.label);
	};

	showSearchResults = function () {
		var i, len, dataArray,
			dataObj, $li;

		dataArray = stateMap.search_results;

		for ( i = 0, len=dataArray.length; i < len; i++ ) {
			dataObj = dataArray[ i ];
			if ( i < jqueryMap.$results.length ) {
				$li = jqueryMap.$results.eq( i );
				bindDataToLi( dataObj, $li );
			}
			else {
				console.log("Too many search results");
			}
		}
	};

	clearSearchResults = function () {
		var $label;
		jqueryMap.$results.each( function (idx) {
			$label = $(this).find('.search-results-item-label');

			$label.text('');
			$(this).attr('data-rabid', '');
			$(this).attr('data-uri', '');
		});		
	};

	updateSearchResults = function ( results ) {
		stateMap.search_results = results;
		clearSearchResults();
		showSearchResults();
	};

	resetSearchResults = function () {
		stateMap.search_results = [];
		clearSearchResults();
		jqueryMap.$input.val("");
	};

	makeDraggable = function () {
		var i;

		jqueryMap.$results.each(function (idx) {
			jqueryMap.$results.eq(idx)
				.draggable({
				connectToSortable: ".edit-sort",
				helper: "clone",
				revert: "invalid"
				});
			i++;
		});
	};

	enableEditControls = function () {
		var term;

		term = terms_model.get_
		jqueryMap.$results.each(function (idx) {
			if ($(this).attr('data-rabid') !== termId) {
				jqueryMap.$results.eq(idx)
					.draggable({
					connectToSortable: ".edit-sort",
					helper: "clone",
					revert: "invalid"
					})
					.find('button').remove();
			}
		});
	};
	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------
	onClickSearch = function () {
		var query = jqueryMap.$input.val();
		$( window ).trigger('termSearch', query);
	};

	onClickReset = function () {
		resetSearchResults();
	};

	onClickDetails = function () {
		var rabid = $(this).parent('li').attr('data-rabid');
		$( window ).trigger('getTermDetails', rabid);
	}

	onClickEdit = function () {
		var rabid = $(this).parent('li').attr('data-rabid');
		$( window ).trigger('editTerm', rabid);
	}

	//-------------------- END EVENT HANDLERS --------------------

	configModule = function ( map ) {
		configMap.terms_model = map.terms_model;
	};

	initModule = function ( $append_target ) {
		$append_target.append( configMap.main_html );

		stateMap.$append_target = $append_target;
		initializeResultsList();
		setJqueryMap();

		jqueryMap.$submit.click( onClickSearch );
		jqueryMap.$reset.click(onClickReset);
		jqueryMap.$details.click( onClickDetails );
		jqueryMap.$edit.click( onClickEdit );

		$( window ).on('termsCreated', function(e) {
			updateSearchResults();
		});

		$( window ).on('termEditable', function(e, termId) {
			// removeControls();
			// makeDraggable();
			enableEditControls(termId);
		});

		return true;
	};

	return {
		configModule		: configModule,
		initModule			: initModule,
		enableEditControls	: enableEditControls,
		updateSearchResults : updateSearchResults
	};
}());