vocab.details = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
		configMap = {
			main_html : String()
				+ '<div class="term-details ui-widget">'
					+ '<div class="ui-widget-header">'
						+ '<span class="edit-mode"></span>'
						+ '<button type="button" class="ui-button edit-button">Edit</button>'
						+ '<button type="button" class="ui-button cancel-edits hide">X</button>'
					+ '</div>'
					+ '<div class="ui-widget-content">'
						+ '<h3 id="termLabel"></h3>'
						+ '<input type="text" class="label-edit hide" />'
						+ '<div class="details-col">'
							+ '<section class="details-group">'
							+ '<h4>Broader</h4>'
							+ '<ul class="details-broader"></ul>'
							+ '</section>'
							+ '<section class="details-group">'
							+ '<h4>Narrower</h4>'
							+ '<ul class="details-narrower"></ul>'
							+ '</section>'
							+ '<section class="details-group">'
							+ '<h4>Related</h4>'
							+ '<ul class="details-related"></ul>'
							+ '</section>'
						+ '</div>'
						+ '<div class="details-col">'
							+ '<section class="details-group">'
							+ '<h4>Alternative Labels</h4>'
							+ '<ul class="details-alternative"></ul>'
							+ '</section>'
							+ '<section class="details-group">'
							+ '<h4>Hidden Labels</h4>'
							+ '<ul class="details-hidden"></ul>'
							+ '</section>'
						+ '</div>'
						+ '<div>'
							+ '<button type="button" class="ui-button submit-edits>Submit</button>'
						+ '</div>'
					+ '</div>'
				+ '</div>',
			terms_model : null,
		},

		stateMap	= {
			$append_target : null,
			term_target : null,
			editing : false
		},

		jqueryMap = {},

		loadTermDetails, load_target_term;
	//----------------- END MODULE SCOPE VARIABLES ---------------

	//--------------------- BEGIN DOM METHODS --------------------
	// Begin DOM method /setJqueryMap/
	setJqueryMap = function () {
		var
			$append_target = stateMap.$append_target;
			$details = $append_target.find( '.term-details' );

		jqueryMap = {
			$details : $details,
			$details_head : $details.find( '#termLabel'),
			$details_groups : $details.find( '.details-group'),
			$edit_mode : $details.find('.edit-mode'),
			$edit_button : $details.find('.edit-button'),
			$cancel_button : $details.find('.cancel-edits'),
			$submit_button : $details.find('.submit-edits')
		};
	};
	// End DOM method /setJqueryMap/

	loadTermDetails = function ( rabid ) {
		var term;
		term = configMap.terms_model.get_term( { rabid : rabid } );
		stateMap.term_target = term;
		load_target_term();
	};

	load_target_term = function () {
		var 
			no_results = [{ 'label'	: 'None',
							'uri'	: '',
							'rabid'	: ''}],
			results_map = {},
			inspected, data,
			key, vals,
			$li, $result_list;

		if ( stateMap.editing === true ) {
			jqueryMap.$edit_mode.text("Editing");
			jqueryMap.$details_groups.each( function () {
				$(this).addClass('editing');
			});
		}
		else {
			jqueryMap.$edit_mode.text("Review");
		}

		jqueryMap.$details.find('li').remove();

		inspected = stateMap.term_target;
		data = inspected.data;
		for (key in data) {
			if (data[key].length === 0) {
				results_map[key] = no_results;
			} else {
				results_map[key] = [];
				for (var i = 0, len=data[key].length; i < len; i++) {
					var nbor = configMap.terms_model.get_term( { uri: data[key][i] });
					results_map[key].push(nbor);
				}
			}
		};


		jqueryMap.$details_head.text( inspected.label );

		for (key in results_map) {
			if (results_map.hasOwnProperty(key)) {
				vals = results_map[key];
				$result_list = jqueryMap.$details.find( '.details-'+key );
				for (var i = 0, len=vals.length; i < len; i++) {
					$li = $('<li/>', {	'data-uri' : vals[i].uri,
										'data-rabid' : vals[i].rabid});
					$li.text(vals[i].label);
					$result_list.append($li);
				}
			}
		}
	};

	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------
	onClickEdit = function () {
		stateMap.editing = true;
		jqueryMap.$edit_button.addClass('hide');
		jqueryMap.$cancel_button.removeClass('hide');
		load_target_term();
		$( window ).trigger("editingEnabled", stateMap.term_target);
	};
	//-------------------- END EVENT HANDLERS --------------------

	configModule = function ( map ) {
		configMap.terms_model = map.terms_model;
	};

	initModule = function ( $append_target ) {
		$append_target.append( configMap.main_html );

		stateMap.$append_target = $append_target;
		setJqueryMap();

		$( window ).on('termInspected', function(e) {
			loadInspected();
		});

		jqueryMap.$edit_button.click( onClickEdit );

		return true;
	};

	return {
		configModule		: configModule,
		initModule			: initModule,
		loadTermDetails		: loadTermDetails
	};
}());
