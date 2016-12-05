vocab.details = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
		configMap = {
			main_html : String()
				+ '<div class="term-details panel panel-default">'
					+ '<div class="row term-details-ctrl">'
						+ '<span class="edit-mode col-sm-9"></span>'
						+ '<div class="term-details-ctrl-toolbar col-sm-3">'
							+ '<button type="button" class="btn btn-primary edit-button term-details-ctrl-btn">'
								+ '<span class="glyphicon glyphicon-pencil" ></span>'
							+ '</button>'
							+ '<button type="button" class="btn btn-danger reset-details term-details-ctrl-btn">'
								+ '<span class="glyphicon glyphicon-remove"></span>'
							+ '</button>'
						+ '</div>'
					+ '</div>'
					+ '<div class="term-inspector row" data-rabid data-uri>'
						+ '<h3 id="termLabel"></h3>'
						+ '<input type="text" class="label-edit hide" />'
						+ '<div class="details-col">'
							+ '<section class="details-group">'
							+ '<h4>Broader</h4>'
							+ '<ul class="details-broader" data-attr="broader"></ul>'
							+ '</section>'
							+ '<section class="details-group">'
							+ '<h4>Narrower</h4>'
							+ '<ul class="details-narrower" data-attr="narrower"></ul>'
							+ '</section>'
							+ '<section class="details-group">'
							+ '<h4>Related</h4>'
							+ '<ul class="details-related" data-attr="related"></ul>'
							+ '</section>'
						+ '</div>'
						+ '<div class="details-col">'
							+ '<section class="details-group">'
							+ '<h4>Alternative Labels</h4>'
							+ '<ul class="details-alternative" data-attr="alternative"></ul>'
							+ '</section>'
							+ '<section class="details-group">'
							+ '<h4>Hidden Labels</h4>'
							+ '<ul class="details-hidden" data-attr="hidden"></ul>'
							+ '</section>'
						+ '</div>'
						+ '<div class="details-footer row hide">'
							+ '<button type="button" class="ui-button submit-edits">Submit</button>'
						+ '</div>'
					+ '</div>'
				+ '</div>',
			terms_model : null,
		},

		stateMap	= {
			$append_target : null,
			term_target : null,
			neighbor_data : {},
			editing : false
		},

		jqueryMap = {},

		makeDroppable, revertDroppable,
		onClickEdit, onClickReset,
		onClickSubmit, getTermData,
		loadTermDetails, buildDataList,
		resetDetails;
	//----------------- END MODULE SCOPE VARIABLES ---------------

	//--------------------- BEGIN DOM METHODS --------------------
	// Begin DOM method /setJqueryMap/
	setJqueryMap = function () {
		var
			$append_target = stateMap.$append_target;
			$details = $append_target.find( '.term-details' );

		jqueryMap = {
			$details : $details,
			$inspector : $details.find( '.term-inspector' ),
			$details_groups : $details.find( '.details-group'),
			$edit_mode : $details.find('.edit-mode'),
			$edit_button : $details.find('.edit-button'),
			$cancel_button : $details.find('.reset-details'),
			$details_foot : $details.find('.details-footer'),
			$submit_button : $details.find('.submit-edits'),
			$label_display : $details.find('#termLabel'),
			$label_editor : $details.find('.label-edit')
		};
	};
	// End DOM method /setJqueryMap/

	loadTermDetails = function ( rabid ) {
		var term;
		
		term = configMap.terms_model.get_term( { rabid : rabid } );
		stateMap.term_target = term;
		jqueryMap.$inspector.attr('data-rabid', term.rabid);
		jqueryMap.$inspector.attr('data-uri', term.uri);
		jqueryMap.$edit_mode.text('Review');
		jqueryMap.$label_display.text( term.label );
		jqueryMap.$details.find('li').remove();
		buildDataList( stateMap.term_target );
	};

	createLiforData = function( dataObj ) {
		var $li, $label, $del_button;

		$li = $('<li/>');
		$label = $('<span/>');
		$label.text(dataObj.label);
		
		$del_button = $('<button/>', {	'type': 'button',
										'class' : 'ui-button remove-data-button hide'});
		$del_button.click( function() {
			onClickRemoveLi( $(this) );
		});
		$del_button.append('<span class="ui-icon ui-icon-closethick"></span>');
		
		$li.append($label);
		$li.append($del_button);

		$li.attr('data-rabid', dataObj.rabid);
		$li.attr('data-uri', dataObj.uri);
		$li.attr('data-label', dataObj.label);

		return $li;
	};

	buildDataList = function ( term ) {
		var
			uris, labels, no_results,
			nbor, labelObj,
			li, li_array,
			data, data_attr, data_vals,
			$li, $data_list;

		uris = ['broader', 'narrower', 'related'];
		labels = ['hidden','alternative'];

		no_results = {	label	: 'None',
						uri		: '',
						rabid	: ''};
		data = term.data;

		for (data_attr in data) {
			li_array = [];
			$data_list = jqueryMap.$inspector.find('ul[data-attr='+data_attr+']');

			if (data[data_attr].length === 0) {
				$li = createLiforData( no_results );
				li_array.push( $li );
			} else {
				data_vals = data[data_attr];
				
				if (uris.indexOf(data_attr) !== -1) {
					data_vals.forEach( function( uri ) {
						nbor = configMap.terms_model.get_term( { uri: uri });
						$li = createLiforData( nbor );
						li_array.push( $li );
					});
				}
				else if (labels.indexOf(data_attr) !== -1) {
					data_vals.forEach( function( label ) {
						labelObj = { label 	: label,
									uri 	: 'label',
									rabid 	: 'label'};
						$li = createLiforData( labelObj );
						li_array.push( $li );
					});					
				}
			}

			li_array.forEach( function ( li ) {
				$data_list.append( li );
			});
		};
	};

	makeDroppable = function () {
		jqueryMap.$inspector.find('ul')
			.addClass('ui-state-default')
			.addClass('edit-sort');
	};

	revertDroppable = function () {
		jqueryMap.$inspector.find('ul')
			.removeClass('ui-state-default')
			.removeClass('edit-sort');
	};

	getTermData = function () {
		var
			data, label,
			$data_group, $data_vals,
			uris, strings,
			data_attr;

		label = null;
		data = {
			'broader' : [],
			'narrower' : [],
			'related' : [],
			'hidden' : [],
			'alternative': []
		};

		uris = ['broader', 'narrower', 'related'];
		strings = ['hidden','alternative'];

		label = jqueryMap.$label_editor.val();

		jqueryMap.$details_groups.each( function () {
			$data_group = $(this).find('ul');
			$data_vals = $data_group.find('li');
			data_attr = $data_group.attr('data-attr');
			if (uris.indexOf(data_attr) !== -1) {
				$data_vals.each( function () {
					data[data_attr].push($(this).attr('data-uri'));
				});
			}
			else if (strings.indexOf(data_attr) !== -1) {
				$data_vals.each( function () {
					data[data_attr].push($(this).attr('data-label'));
				});
			} else {
				console.log('problem!');
			}
		})

		return { label : label, data : data };
	};

	resetDetails = function () {
		stateMap.editing = false;
		stateMap.term_target = null;
		revertDroppable();
		jqueryMap.$details.find('li').remove();
		jqueryMap.$details_groups.each( function () {
			$(this).removeClass('editing');
		});
		jqueryMap.$label_editor.val('');
		jqueryMap.$label_display.removeClass('hide');
		jqueryMap.$label_editor.addClass('hide');
		jqueryMap.$details_foot.addClass('hide');
		jqueryMap.$edit_button.removeClass('hide');
	};
	//---------------------- END DOM METHODS ---------------------

	//------------------- BEGIN EVENT HANDLERS -------------------
	onClickEdit = function () {
		var term;

		term = stateMap.term_target;
		stateMap.editing = true;
		configMap.terms_model.set_term_editing( { rabid: term.rabid } );
		stateMap.term_target = configMap.terms_model.get_term( { rabid : term.rabid } );
		makeDroppable();
		jqueryMap.$edit_mode.text("Editing");
		jqueryMap.$details_groups.each( function () {
			$(this).addClass('editing');
		});
		jqueryMap.$label_editor.val( stateMap.term_target.label );
		jqueryMap.$label_display.addClass('hide');
		jqueryMap.$label_editor.removeClass('hide');
		jqueryMap.$details_foot.removeClass('hide');
		jqueryMap.$edit_button.addClass('hide');
		jqueryMap.$inspector.find('.remove-data-button').removeClass('hide');
		jqueryMap.$inspector.find('li[data-uri=""]').remove();
		$( window ).trigger("editingEnabled", stateMap.term_target.rabid);
	};

	onClickReset = function () {
		resetDetails();
		configMap.terms_model.reset_term_editing();
		$( window ).trigger("resetDetails");
	}

	onClickSubmit = function () {
		var term, data, edits;

		term = stateMap.term_target;
		data = getTermData();

		edits = { rabid : term.rabid, update : data };

		$( window ).trigger('submitTermEdits', edits);
	};

	onClickRemoveLi = function ( button ) {
		var $li;

		$li = button.parent('li');
		$li.remove();
	}
	//-------------------- END EVENT HANDLERS --------------------

	configModule = function ( map ) {
		configMap.terms_model = map.terms_model;
	};

	initModule = function ( $append_target ) {
		$append_target.append( configMap.main_html );

		stateMap.$append_target = $append_target;
		setJqueryMap();

		jqueryMap.$inspector.find('ul')
			.sortable({
				revert: "true",
				dropOnEmpty: true,
				stop : function ( e, ui ) {
					var $del_button;
					
					$del_button = $('<button/>', {	'type': 'button',
													'class' : 'ui-button remove-data-button'});
					$del_button.click( function() {
						onClickRemoveLi( $(this) );
					});
					$del_button.append('<span class="ui-icon ui-icon-closethick"></span>');

					ui.item.append( $del_button );
					ui.item.removeClass('search-results-item');
				}
			});

		jqueryMap.$edit_button.click( onClickEdit );
		jqueryMap.$cancel_button.click( onClickReset );
		jqueryMap.$submit_button.click( onClickSubmit );

		return true;
	};

	return {
		configModule		: configModule,
		initModule			: initModule,
		loadTermDetails		: loadTermDetails,
		resetDetails 		: resetDetails
	};
}());
