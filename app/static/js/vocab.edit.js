vocab.edit = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
		configMap = {
			main_html : String()
				+ '<div class="editor">'
					+ '<div>'
						+ '<h3 id="edit-head"></h3>'
					+ '</div>'
					+ '<div id="edit-ctrl">'
						+ '<div class="inputBox edit-row">'
							+ '<div class="edit-cell">'
								+ '<label>Label</label>'
								+ '<input />'
							+ '</div>'
							+ '<div class="edit-cell">'
								+ '<button>Cancel Edits</button>'
							+ '</div>'
						+ '</div>'
						+ '<div class="edit-row">'
							+ '<div class="edit-cell">'
								+ '<section class="edit-group">'
									+ '<h4>Broader</h4>'
									+ '<ul class="edit-broader edit-sort" data-edit="broader"></ul>'
								+ '</section>'
							+ '</div>'
							+ '<div class="edit-cell">'
								+ '<section class="edit-group">'
									+ '<h4>Narrower</h4>'
									+ '<ul class="edit-narrower edit-sort" data-edit="narrower"></ul>'
								+ '</section>'
							+ '</div>'
							+ '<div class="edit-cell">'
								+ '<section class="edit-group">'
									+ '<h4>Related</h4>'
									+ '<ul class="edit-related edit-sort" data-edit="related"></ul>'
								+ '</section>'
							+ '</div>'
						+ '</div>'
						+ '<div class="edit-row">'
							+ '<div class="edit-cell">'
								+ '<section class="edit-group">'
									+ '<h4>Alternative labels</h4>'
									+ '<ul class="edit-alternative edit-sort" data-edit="alternative"></ul>'
								+ '</section>'
							+ '</div>'
							+ '<div class="edit-cell">'
								+ '<section class="edit-group">'
									+ '<h4>Hidden labels</h4>'
									+ '<ul class="edit-hidden edit-sort" data-edit="hidden"></ul>'
								+ '</section>'
							+ '</div>'
						+ '</div>'
						+ '<div class="edit-row inputBox">'
							+ '<div>'
								+ '<button class="edit-submit">Submit</button>'
							+ '</div>'
						+ '</div>'
					+ '</div>'
				+ '</div>',
			terms_model : null,
		},

		stateMap	= {
			$append_target : null,
			search_results : [],
			results_page : 0
		},

		jqueryMap = {},
		initializeResultsList, makeDroppable,
		updateResultsList, onClickSearch,
		displayResultsPage, clearResultsList,
		gatherData, resetModule,
		setJqueryMap, initModule, configModule;
	//----------------- END MODULE SCOPE VARIABLES ---------------
	//------------------- BEGIN UTILITY METHODS ------------------
	gatherData = function () {
		var editable, data, rabid, graph;
		
		data = {
			'broader' : [],
			'narrower' : [],
			'related' : [],
			'alternative': [],
			'hidden' : []
		};
		editable = configMap.terms_model.get_editable();
		jqueryMap.$edit_groups.each( function () {
			$ul = $(this).find('ul');
			$termType = $ul.attr('data-edit');
			$li = $ul.find('li');
			$li.each( function () {
				if ($(this).attr('data-uri')) {
					uri = $(this).attr('data-uri');
					data[$termType].push(uri);
				}
			});
		});
		editable.data = data;
		return editable;
	};
	//-------------------- END UTILITY METHODS -------------------

	//--------------------- BEGIN DOM METHODS --------------------
	// Begin DOM method /setJqueryMap/
	setJqueryMap = function () {
		var
			$append_target = stateMap.$append_target;
			$editor = $append_target.find( '.editor' );

		jqueryMap = {
			$editor : $editor,
			$edit_head : $editor.find( '#edit-head' ),
			$edit_ctrl : $editor.find( '#edit-ctrl'),
			$edit_groups : $editor.find( '.edit-group'),
			$submit : $editor.find('.edit-submit')
		};
	};
	// End DOM method /setJqueryMap/

	loadEditable = function () {
		var 
			no_results = [{label:'<span class="ui-icon ui-icon-plus"></span>'}],
			results_map = {},
			editable, data,
			key, vals, $result_list,
			li;

		jqueryMap.$edit_ctrl.find('li').remove();

		editable = configMap.terms_model.get_editable();
		data = editable.data;
		for (key in data) {
			if (data[key].length === 0) {
				results_map[key] = no_results;
			} else {
				results_map[key] = [];
				for (var i = 0, len=data[key].length; i < len; i++) {
					var nbor = configMap.terms_model.get_by_uri(data[key][i]);
					results_map[key].push({uri: data[key][i], label: nbor.label});
				}
			}
		};

		jqueryMap.$edit_head.text( editable.label );
		jqueryMap.$edit_groups.each( function (idx) {
			$(this).addClass('show');
		})

		for (key in results_map) {
			if (results_map.hasOwnProperty(key)) {
				vals = results_map[key];
				$result_list = jqueryMap.$edit_ctrl.find( '.edit-'+key );
				for (var i = 0, len=vals.length; i < len; i++) {
					li = $('<li/>').append(vals[i].label);
					if ('uri' in vals[i]) {
						li.attr('data-uri', vals[i].uri);
					}
					$result_list.append(li);
				}
			}
		}
	};

	makeDroppable = function () {
		jqueryMap.$edit_ctrl.find('ul')
			.addClass('ui-state-default')
			.sortable({
				revert: "true",
				dropOnEmpty: true
			});
	};

	resetModule = function () {
		jqueryMap.$edit_head.text("");
		jqueryMap.$edit_ctrl.find('li').remove();
	};
	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------
	onClickSubmit = function () {
		var data;
		data = gatherData();
		$( window ).trigger('submitTermUpdate', data);
	}

	//-------------------- END EVENT HANDLERS --------------------

	configModule = function ( map ) {
		configMap.terms_model = map.terms_model;
	};

	initModule = function ( $append_target ) {
		$append_target.append( configMap.main_html );

		stateMap.$append_target = $append_target;
		setJqueryMap();

		jqueryMap.$submit.click( onClickSubmit );

		$( window ).on('termEditable', function(e) {
			loadEditable();
			makeDroppable();
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