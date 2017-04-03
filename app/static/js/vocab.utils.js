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

	invertOperations = function ( ops, inverse, subject ) {
		var reverseOperations, out;

		out = [];

		ops.forEach( function( opObj ) {
			var newOp;

			newOp = { 'op': opObj['op'],
					  'path': inverse[opObj['path']],
					  'value': [ subject ]
					};

			opObj['value'].forEach( function( val ) {
				var withTarget;

				withTarget = { 'target': val, 'operation': newOp };
				out.push(withTarget);
			});	
		});

		return out;
	};

	arrayMapDiff = function ( first, second ) {
		var out = [];

		for ( var key in first ) {
			if ( second.hasOwnProperty(key) ) {
				if ( first.hasOwnProperty(key) ) {
					var firstArr = first[key],
						secondArr = second[key],
						diff;
					diff = arrayDiff(firstArr, secondArr);
					for (var op in diff) {
						if (diff.hasOwnProperty(op) ) {
							out.push({ 'op': op, 'path': key, 'value': diff[op] });
						}
					}
				}
			} else if ( first.hasOwnProperty(key) ) {
					out.push({ 'op': 'remove', 'path': key, 'value': first[key] });
			}
		}

		for ( var key in second ) {
			if ( !(first.hasOwnProperty(key) ) ){
				if ( second.hasOwnProperty(key) ) {
					out.push({ 'op': 'add', 'path': key, 'value': second[key] });
				}
			}
		}

		return out;
	};

	arrayDiff = function ( first, second ) {
		var add, remove, copy,
			out = {};

		remove = first.filter( function(val) {
			return second.indexOf(val) < 0;
		});

		add = second.filter( function(val) {
			return first.indexOf(val) < 0;
		});

		copy = first.filter( function(val) {
			return !(second.indexOf(val) < 0);
		});

		if (add.length > 0)		{ out.add = add };
		if (remove.length > 0)	{ out.remove = remove };
		if (copy.length > 0)	{ out.copy = copy };

		return out ;
	};

	return {
		mergeMaps : mergeMaps,
		invertOperations: invertOperations,
		arrayDiff : arrayDiff,
		arrayMapDiff : arrayMapDiff
	};
}());