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

	dataDifference = function ( newData, oldData ) {
		var 
			addData = [],
			removeData = [];

		for ( var key in newData ) {
			if ( key in oldData ) {
				var newArr = newData[key];
				var oldArr = oldData[key];

				newArr.forEach( function( uri ) {
					if (oldArr.indexOf( uri ) < 0) {
						addData.push( { 'attr': key, 'uri': uri } );
					}
				});

				oldArr.forEach( function( uri ) {
					if (newArr.indexOf( uri ) < 0) {
						removeData.push( { 'attr': key, 'uri': uri } );
					}
				});
			}
		}

		return { 'add': addData, 'remove': removeData };
	};

	arrayDiff = function ( first, second ) {
		var out = { 'add': [], 'remove': []};

		first.forEach( function( data ) {
			if (second.indexOf( data ) < 0) {
				out['remove'].push( data );
			}
		});

		second.forEach( function( data ) {
			if (first.indexOf( data ) < 0) {
				out['add'].push( data );
			}
		});

		return out;
	}

	return {
		mergeMaps : mergeMaps,
		arrayDiff : arrayDiff,
		dataDifference : dataDifference
	};
}());