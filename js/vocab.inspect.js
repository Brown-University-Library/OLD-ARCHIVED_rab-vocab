vocab.inspect = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
		configMap = {
			main_html : String()
				+ '<div class="inspect">'
					+ '<h3 id="inspectedLabel"></h3>'
					+ '<section class="inspect-group">'
					+ '<h4>Broader</h4>'
					+ '<ul class="inspect-broader"></ul>'
					+ '</section>'
					+ '<section class="inspect-group">'
					+ '<h4>Narrower</h4>'
					+ '<ul class="inspect-narrower"></ul>'
					+ '</section>'
					+ '<section class="inspect-group">'
					+ '<h4>Related</h4>'
					+ '<ul class="inspect-related"></ul>'
					+ '</section>'
					+ '<section class="inspect-group">'
					+ '<h4>Alternative Labels</h4>'
					+ '<ul class="inspect-alternative"></ul>'
					+ '</section>'
					+ '<section class="inspect-group">'
					+ '<h4>Hidden Labels</h4>'
					+ '<ul class="inspect-hidden"></ul>'
					+ '</section>'
				+ '</div>',
			terms_model : null,
		},

		stateMap	= {
			$append_target : null,
		},

		jqueryMap = {},

		loadInspected;
	//----------------- END MODULE SCOPE VARIABLES ---------------

	//--------------------- BEGIN DOM METHODS --------------------
	// Begin DOM method /setJqueryMap/
	setJqueryMap = function () {
		var
			$append_target = stateMap.$append_target;
			$inspect = $append_target.find( '.inspect' );

		jqueryMap = {
			$inspect : $inspect,
			$inspect_head : $inspect.find( '#inspectedLabel'),
			$inspect_groups : $inspect.find( '.inspect-group')
		};
	};
	// End DOM method /setJqueryMap/

	loadInspected = function () {
		var 
			no_results = ["None"],
			results_map, inspected,
			key, vals, $result_list;

		jqueryMap.$inspect.find('li').remove();

		inspected = configMap.terms_model.get_inspected();
		results_map = {
			'broader' : inspected.broader.length > 0 ? inspected.broader : no_results,
			'narrower' : inspected.narrower.length > 0 ? inspected.narrower: no_results,
			'related' : inspected.related.length > 0 ? inspected.related : no_results,
			'hidden' : inspected.hidden.length > 0 ? inspected.hidden : no_results,
			'alternative' : inspected.alternative.length > 0 ? inspected.alternative : no_results,
		};

		jqueryMap.$inspect_head.text( inspected.label[0] );
		jqueryMap.$inspect_groups.each( function (idx) {
			$(this).addClass('show');
		})

		for (key in results_map) {
			if (results_map.hasOwnProperty(key)) {
				vals = results_map[key];
				$result_list = jqueryMap.$inspect.find( '.inspect-'+key );
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
		initModule			: initModule
	};
}());