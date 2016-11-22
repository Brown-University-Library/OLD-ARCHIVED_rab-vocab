/*
 * spa.shell.js
 * Shell module for SPA
*/

/*jslint browser : true, continue : true,
devel : true, indent : 2, maxerr : 50,
newcap : true, nomen : true, plusplus : true,
regexp: true, sloppy : true, vars : false,
white : true
*/
/*global $, spa */

vocab.shell = (function () {
	//---------------- BEGIN MODULE SCOPE VARIABLES --------------
	var
    configMap = {
			main_html : String()
				+	'<div class="vocab-shell-main">'
          + '<div class="vocab-shell-head">'
            + '<div class="vocab-shell-head-logo">'
              + '<h1>Vocabulary Manager</h1>'
            + '</div>'
          + '</div>'
          + '<div class="vocab-shell-ctl">'
            + '<div class="vocab-shell-search"></div>'
            + '<div class="vocab-shell-details hide"></div>'
          + '</div>'
				+	'</div>',
		},
		
    stateMap	= {
      $container : undefined
    },
		
    jqueryMap = {},

    onGetTermDescription, onTermDescribed,
    engageEditMode,
    onTermSearch, onSearchCompleted,
		setJqueryMap, initModule
    ;
	//----------------- END MODULE SCOPE VARIABLES ---------------
  //------------------- BEGIN UTILITY METHODS ------------------
  //-------------------- END UTILITY METHODS -------------------

  //--------------------- BEGIN DOM METHODS --------------------
  setJqueryMap = function () {
  	var $container = stateMap.$container;
  	jqueryMap = {
      $container : $container,
      $search : $container.find('.vocab-shell-search'),
      $details : $container.find('.vocab-shell-details'),
      $edit : $container.find('.vocab-shell-edit')
    };
  };

  //---------------------- END DOM METHODS ---------------------
  //------------------- BEGIN EVENT HANDLERS -------------------

  onTermSearch = function ( query ) {
    vocab.model.search_terms( query );
  };

  onSearchCompleted = function ( query ) {
    var results;
    results = vocab.model.get_term_search_matches( query );
    vocab.search.updateSearchResults( results );
  };

  onGetTermDescription = function ( rabid ) {
    vocab.model.describe_term( rabid );
  };

  onTermDescribed = function ( rabid ) {
    vocab.details.loadTermDetails( rabid );
    jqueryMap.$details.removeClass('hide');
  };

  engageEditMode = function () {
    vocab.search.enableEditControls();
  };
  //-------------------- END EVENT HANDLERS --------------------
  //---------------------- BEGIN CALLBACKS ---------------------
  //----------------------- END CALLBACKS ----------------------
  //------------------- BEGIN PUBLIC METHODS -------------------
  // Begin Public method /initModule/
  initModule = function ( $container ) {
  	// load HTML and map jQuery collections
  	stateMap.$container = $container;
  	$container.html( configMap.main_html );
  	setJqueryMap();

    // configure and initialize feature modules
    vocab.search.configModule({
      terms_model : vocab.model.terms
    });
    vocab.search.initModule( jqueryMap.$search );

    vocab.details.configModule({
      terms_model : vocab.model.terms
    });
    vocab.details.initModule( jqueryMap.$details );

    vocab.edit.configModule({
      terms_model : vocab.model.terms
    });
    vocab.edit.initModule( jqueryMap.$edit );

    //set event handlers
    $( window ).on( 'termSearch', function( e, query ) {
      onTermSearch( query );
    });

    $( window ).on( 'searchComplete', function( e, query ) {
      onSearchCompleted( query );
    });

    $( window ).on('describeTerm', function( e, rabid ) {
      onGetTermDescription( rabid );
    });

    $( window ).on('termDescribed', function( e, rabid ) {
      onTermDescribed( rabid );
    });
    $( window ).on('editingEnabled', function( e ) {
      engageEditMode();
    });
  };

  return { initModule : initModule };
  //------------------- END PUBLIC METHODS ---------------------
}());