vocab.utils = (function () {
	var
		makeError, merge,

		dataDifference, arrayDiff;

	makeError = function ( name_text, msg_text, data ) {
		var error 		= new Error();
		error.name 		= name_text;
		error.message = msg_text;

		if ( data ){ error.data = data; }

		return error;
	};

	mergeMaps = function ( map_to_update, map_to_add ) {
		var key_name;
		for ( key_name in map_to_add) {
			map_to_update[ key_name ] = map_to_add[ key_name ];
		}

		return map_to_update;
	};

	intersectMaps = function ( map_to_update, map_to_add ) {
		var key_name;
		for ( key_name in map_to_update) {
			map_to_update[ key_name ] = map_to_add[ key_name ];
		}

		return map_to_update;
	};

	mergeMap = function ( map_to_update, map_to_add ){
		var
			key_name, error;

		for ( key_name in map_to_add ){
			if ( map_to_add.hasOwnProperty( key_name ) ){
				if ( map_to_update.hasOwnProperty( key_name ) ){
					map_to_update[key_name] = map_to_add[key_name];
				}
				else {
					error = makeError( 'Bad Input',
						'Setting config key |' + key_name + '| is not supported'
						);
					throw error;
				}
			}
		}
		return map_to_update;
	};

	arrayMapDiff = function ( first, second ) {
		var out = [];

		for ( var key in first ) {
			if ( second.hasOwnProperty(key) ) {
				if ( first.hasOwnProperty(key) ) {
					var firstArr = first[key],
						secondArr = second[key],
						out;
					out = arrayDiff(firstArr, secondArr);


				}
			}
		}
	};

	arrayDiff = function ( first, second ) {
		var add, remove, copy;

		remove = first.filter( function(val) {
			return second.indexOf(val) < 0;
		});

		add = second.filter( function(val) {
			return first.indexOf(val) < 0;
		});

		copy = first.filter( function(val) {
			return !(second.indexOf(val) < 0);
		});

		return { 'add': add, 'remove': remove, 'copy': copy };
	};

	return {
		mergeMaps : mergeMaps,
		arrayDiff : arrayDiff,
		arrayMapDiff : arrayMapDiff
	};
}());