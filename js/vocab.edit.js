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
						+ '<div class="inputBox">'
							+ '<div>'
								+ '<label>Label</label>'
								+ '<input />'
							+ '</div>'
							+ '<div>'
								+ '<button>Cancel Edits</button>'
							+ '</div>'
						+ '</div>'
						+ '<div class="row">'
							+ '<div>'
								+ '<section class="edit-group">'
									+ '<h4>Broader</h4>'
									+ '<ul class="edit-broader edit-sort"></ul>'
								+ '</section>'
							+ '</div>'
							+ '<div>'
								+ '<section class="edit-group">'
									+ '<h4>Narrower</h4>'
									+ '<ul class="edit-narrower edit-sort"></ul>'
								+ '</section>'
							+ '</div>'
							+ '<div>'
								+ '<section class="edit-group">'
									+ '<h4>Related</h4>'
									+ '<ul class="edit-related edit-sort"></ul>'
								+ '</section>'
							+ '</div>'
						+ '</div>'
						+ '<div>'
							+ '<div>'
								+ '<section class="edit-group">'
									+ '<h4>Alternative labels</h4>'
									+ '<ul class="edit-alternative edit-sort"></ul>'
								+ '</section>'
							+ '</div>'
							+ '<div>'
								+ '<section class="edit-group">'
									+ '<h4>Hidden labels</h4>'
									+ '<ul class="edit-hidden edit-sort"></ul>'
								+ '</section>'
							+ '</div>'
						+ '</div>'
						+ '<div class="inputBox">'
							+ '<div>'
								+ '<button>Submit</button>'
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
		setJqueryMap, initModule, configModule;
	//----------------- END MODULE SCOPE VARIABLES ---------------

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
			$edit_groups : $inspect.find( '.edit-group')
		};
	};
	// End DOM method /setJqueryMap/

	loadEditable = function () {
		var 
			no_results = ['<span class="glyphicon glyphicon-plus"></span>'],
			results_map = {},
			editable, data,
			key, vals, $result_list;

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
					results_map[key].push(nbor.label);
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
					$result_list.append('<li class="list-group-item">'+vals[i]+'</li>');
				}
			}
		}
	};

	makeDroppable = function () {
		jqueryMap.$edit_ctrl.find('ul')
			.addClass('ui-state-default')
			.sortable({
				revert: "true"
			});
	};
	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------
	onSubmit = function () {
		var data;
		data = gatherData();
		$( window ).trigger('submitTermUpdate');
	}

	//-------------------- END EVENT HANDLERS --------------------

	configModule = function ( map ) {
		configMap.terms_model = map.terms_model;
	};

	initModule = function ( $append_target ) {
		$append_target.append( configMap.main_html );

		stateMap.$append_target = $append_target;
		setJqueryMap();

		$( window ).on('termEditable', function(e) {
			loadEditable();
			makeDroppable();
		});

		return true;
	};

	return {
		configModule		: configModule,
		initModule			: initModule
	};
}());