vocab.utils = (function () {
	var makeError, merge;

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

	function paginate(list, pageSize) {
		if (pageSize < 2) {
			return [list];
		}

		var
			total_len = list.length,
			out = [],
			i = 0;

		while (i < total_len) {
			out.push(list.slice(i, i += pageSize));
		}

		return out;
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

	return {
		mergeMaps : mergeMaps,
		paginate : paginate
	};
}());