var vocab = (function () {
	'use strict';
	var initModule = function ( $container ) {
		vocab.data.initModule();
		vocab.model.initModule();
		// vocab.shell.initModule ( $container );
	};

	return { initModule: initModule };
}());