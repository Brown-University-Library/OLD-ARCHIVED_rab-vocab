var vocab = (function () {
	'use strict';
	var initModule = function ( $container ) {
		vocab.data.configModule( vocab.config.dev );

		vocab.data.initModule();
		vocab.model.initModule();
		vocab.shell.initModule ( $container );
	};

	return { initModule: initModule };
}());
