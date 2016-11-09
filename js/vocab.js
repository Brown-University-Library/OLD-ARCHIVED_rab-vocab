var vocab = (function () {
	'use strict';
	var initModule = function ( $container ) {
		vocab.data.configModule( vocab.config.local );

		vocab.data.initModule();
		vocab.model.initModule();
		vocab.shell.initModule ( $container );
	};

	return { initModule: initModule };
}());