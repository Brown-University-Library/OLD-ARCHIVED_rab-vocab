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
				+	'<div class="vocab-shell-head">'
					+	'<div class="vocab-shell-head-logo">'
            + '<h1>Vocabulary Manager</h1>'
          + '</div>'
				+	'</div>'
				+	'<div class="vocab-shell-main">'
					+	'<div class="vocab-view row">'
            + '<div class="vocab-search col-sm-9"></div>'
            + '<div class="vocab-inspect col-sm-3"></div>'
          + '</div>'
					+	'<div class="vocab-edit row"></div>'
				+	'</div>',
		},
		stateMap	= {
      $container : undefined
    },
		jqueryMap = {},

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
      $search : $container.find('.vocab-search'),
      $inspect : $container.find('.vocab-inspect'),
      $edit : $container.find('.vocab-edit')
    };
  };

  //---------------------- END DOM METHODS ---------------------
  //------------------- BEGIN EVENT HANDLERS -------------------
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

    vocab.inspect.configModule({
      terms_model : vocab.model.terms
    });
    vocab.inspect.initModule( jqueryMap.$inspect );
  };

  return { initModule : initModule };
  //------------------- END PUBLIC METHODS ---------------------
}());