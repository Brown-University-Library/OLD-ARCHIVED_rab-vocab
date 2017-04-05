var vocab = (function () {
	'use strict';
	var initModule = function ( $container, config ) {
		vocab.data.configModule( config );

		vocab.data.initModule();
		vocab.model.initModule();
		vocab.shell.initModule ( $container );
	};

	return { initModule: initModule };
}());
