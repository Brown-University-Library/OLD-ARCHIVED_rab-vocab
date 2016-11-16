vocab.details = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
		configMap = {
			main_html : String()
				+ '<div class="term-details ui-widget">'
					+ '<h2 class="ui-widget-header">Review</h2>'
					+ '<h2 class="ui-widget-header hide">Edit</h2>'
					+ '<div class="ui-widget-content">'
						+ '<h3 id="termLabel"></h3>'
						+ '<input type="text" class="label-edit hide"></input>'
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
					+ '</div>'
				+ '</div>',
			terms_model : null,
		},

		stateMap	= {
			$append_target : null,
		},

		jqueryMap = {},

		loadTermDetails;
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
			$details_groups : $details.find( '.details-group')
		};
	};
	// End DOM method /setJqueryMap/

	loadTermDetails = function ( rabid ) {
		var 
			no_results = ["None"],
			results_map = {},
			inspected, data,
			key, vals, $result_list;

		jqueryMap.$details.find('li').remove();

		inspected = configMap.terms_model.get_by_rabid( rabid );
		data = inspected.data;
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

		// results_map = {
		// 	'broader' : data.broader.length > 0 ? data.broader : no_results,
		// 	'narrower' : data.narrower.length > 0 ? data.narrower: no_results,
		// 	'related' : data.related.length > 0 ? data.related : no_results,
		// 	'hidden' : data.hidden.length > 0 ? data.hidden : no_results,
		// 	'alternative' : data.alternative.length > 0 ? data.alternative : no_results,
		// };


		jqueryMap.$details_head.text( inspected.label );
		jqueryMap.$details_groups.each( function (idx) {
			$(this).addClass('show');
		})

		for (key in results_map) {
			if (results_map.hasOwnProperty(key)) {
				vals = results_map[key];
				$result_list = jqueryMap.$details.find( '.details-'+key );
				for (var i = 0, len=vals.length; i < len; i++) {
					$result_list.append('<li>'+vals[i]+'</li>');
				}
			}
		}
	};

	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------

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

		return true;
	};

	return {
		configModule		: configModule,
		initModule			: initModule,
		loadTermDetails		: loadTermDetails
	};
}());
