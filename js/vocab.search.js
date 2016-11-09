vocab.search = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
		configMap = {
			main_html : String()
				+ '<div class="search ui-widget">'
			 		+ '<div class="search-ctrl ui-widget-header">'
				 		+ '<input class="search-input ui-autocomplete-input" type="text" />'
				 		+ '<button type="button" class="search-submit ui-button">Search</button>'
					+ '</div>'
					+ '<ul class="search-results-list ui-widget-content"></ul>'
				+ '</div>',
			terms_model : null,
			cols_for_page : 3,
			rows_for_col : 6
		},

		stateMap	= {
			$append_target : null,
			search_results : [],
			results_page : 0
		},

		jqueryMap = {},
		initializeResultsList, makeDraggable,
		enableEditControls, resetModule,
		updateResultsList, onClickSearch,
		displayResultsPage, clearResultsList,
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
			$inspect: $search.find( '.inspect'),
			$edit: $search.find( '.edit'),
			$results: $search.find( '.search-results-list li' ),
		};
	};
	// End DOM method /setJqueryMap/
	initializeResultsList = function () {
		var i, $result_list;
		
		$result_list = stateMap.$append_target.find('.search-results-list');

		i = 0;
		while (i < configMap.cols_for_page) {
			var $col = $('<div/>', {'class': 'search-results-col', 'data-column': i});
			$result_list.append($col);
			i++;
		}

		$result_list.find('div').each( function (idx) {
			i = 0;
			while (i < configMap.rows_for_col) {
				var $row, $button;

				$row = $('<li/>', {	'class': '','data-rabid': ''});
				$inspect_button = $('<button/>', { 	'class': 'search-result-btn inspect ui-button'});
				$edit_button = $('<button/>', { 'class': 'search-result-btn edit ui-button'});

				$row.append('<span class="result-label"></span>');
				$inspect_button.append('<span class="ui-icon ui-icon-search"></span>');
				$edit_button.append('<span class="ui-icon ui-icon-pencil"></span>');
				$row.append($edit_button);
				$row.append($inspect_button);

				$(this).append($row);
				i++;
			} 
		});
	};

	updateResultsList = function () {
		stateMap.search_results = configMap.terms_model.get_items();
		stateMap.results_page = 0;
		displayResultsPage();		
	};

	clearResultsList = function () {
		jqueryMap.$results.each( function (idx) {
			$(this).find('.result-label').text('');
			$(this).attr('data-rabid', '');
		});

		return true;
	};

	displayResultsPage = function () {
		var
			i, page,
			paged_results = [],
			results_length = stateMap.search_results.length;

		clearResultsList();

		if ( results_length === 0 ) { return true };

		i = 0;
		while ( i < results_length ) {
			paged_results.push(
				stateMap.search_results.slice(
					i, i += configMap.rows_for_col * configMap.cols_for_page));
		}

		page = paged_results[ stateMap.results_page ];
		i = 0;
		while ( i < page.length ) {
			var 
				$result = jqueryMap.$results.eq(i);

			$result.find('.result-label').text(page[i].label);
			$result.attr('data-rabid', page[i].id);
			$result.attr('data-uri', page[i].uri);
			i++;
		}
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

	enableEditControls = function (termId) {
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

	resetModule = function () {
		$('.search-input').val("");
		clearResultsList();
	};
	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------
	onClickSearch = function () {
		var query = $('.search-input').val();
		$( window ).trigger('termSearch', query);
	};

	onClickInspect = function () {
		var rabid = $(this).parent('li').attr('data-rabid');
		$( window ).trigger('inspectTerm', rabid);
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
		jqueryMap.$inspect.click( onClickInspect );
		jqueryMap.$edit.click( onClickEdit );

		$( window ).on('termsCreated', function(e) {
			updateResultsList();
		});

		$( window ).on('termEditable', function(e, termId) {
			// removeControls();
			// makeDraggable();
			enableEditControls(termId);
		});

		$( window ).on('resetModel', function(e) {
			resetModule();
		})

		return true;
	};

	return {
		configModule		: configModule,
		initModule			: initModule
	};
}());