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

	//http://stackoverflow.com/questions/8188548/splitting-a-js-array-into-n-arrays
	function chunkify(a, n, balanced) {
		if (n < 2)
			return [a];

		var
			len = a.length,
			out = [],
			i = 0,
			size;

		if (len % n === 0) {
			size = Math.floor(len / n);
			while (i < len) {
				out.push(a.slice(i, i += size));
			}
		}

		else if (balanced) {
			while (i < len) {
				size = Math.ceil((len - i) / n--);
				out.push(a.slice(i, i += size));
			}
		}

		else {

			n--;
			size = Math.floor(len / n);
			if (len % size === 0)
				size--;
			while (i < size * n) {
				out.push(a.slice(i, i += size));
			}
			out.push(a.slice(size * n));

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
		chunkify : chunkify
	};
}());