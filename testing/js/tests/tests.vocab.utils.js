QUnit.test( "arrayDiff should return an object \
	with missing and additional items", function( assert ) {
		var arr1, arr2, diff;

		arr1 = [ 'foo', 'bar', 3 ];
		arr2 = [ 1, 2, 3 ];

		diff = vocab.utils.arrayDiff(arr1, arr2);
		assert.deepEqual(
			diff['add'], [ 1, 2 ], "Added data in obj['add']");
		assert.deepEqual(
			diff['remove'], [ 'foo', 'bar' ], "Removed data in obj['remove']");
		assert.deepEqual(
			diff['copy'], [ 3 ], "Copied data in obj['copy']");

		arr1 = [ 'foo', 'bar' ];
		arr2 = [ 1, 2, 3 ];

		diff = vocab.utils.arrayDiff(arr1, arr2);
		assert.deepEqual(
			diff, { 'add': [ 1,2,3 ], 'remove': ['foo', 'bar'] },
			"Empty results are omitted");
});

QUnit.test( "arrayMapDiff should return an array \
	of operations to perform", function( assert ) {
		var map1, map2, diff;

		map1 = { 'foo': [ 1, 2, 3 ], 'bar': [ 'x', 'y', 'z' ] };
		map2 = { 'foo': [ 3, 4, 5 ], 'bar': [ 'a', 'b', 'c'] };

		diff = vocab.utils.arrayMapDiff(map1, map2);
		assert.deepEqual(
			diff, [	{'op':'add', 'path':'foo', 'value': [4, 5] },
					{'op':'remove', 'path':'foo', 'value': [1, 2] },
					{'op':'copy', 'path':'foo', 'value': [3] },
					{'op':'add', 'path':'bar', 'value': ['a','b','c'] },
					{'op':'remove', 'path':'bar', 'value': ['x','y','z'] }
				],
			"Returns different operations for object modification \
			according to JSON Patch guidelines");

		map1 = { 'foo': [ 1, 2, 3 ], 'bar': [ 'x', 'y', 'z' ] };
		map2 = { 'foo': [ 3, 4, 5 ], 'baz': [ 'a', 'b', 'c'] };
		diff = vocab.utils.arrayMapDiff(map1, map2);

		assert.deepEqual(
			diff, [	{'op':'add', 'path':'foo', 'value': [4, 5] },
					{'op':'remove', 'path':'foo', 'value': [1, 2] },
					{'op':'copy', 'path':'foo', 'value': [3] },
					{'op':'remove', 'path':'bar', 'value': ['x','y','z'] },
					{'op':'add', 'path':'baz', 'value': ['a','b','c'] }
				],
			"Missing or additional keys are fully removed or added");
});

QUnit.test( "invertOperations takes a list of operations, \
	a set of inverse properties, and reverses the operations", function( assert ) {

		var ops, sbj, inv, invOps;

		sbj = 'funk';
		ops = [	{'op':'remove', 'path':'bar', 'value': ['x','y','z'] },
				{'op':'add', 'path':'baz', 'value': ['a','b','c'] }
				];
		inv = { 'bar': 'rab', 'baz': 'zab' } ;
		invOps = vocab.utils.invertOperations(ops, inv, sbj);
		assert.deepEqual(
			invOps, [
					{	'target': 'x',
						'operation': {'op':'remove', 'path':'rab', 'value': ['funk'] }
					},
					{	'target': 'y',
						'operation': {'op':'remove', 'path':'rab', 'value': ['funk'] }
					},
					{	'target': 'z',
						'operation': {'op':'remove', 'path':'rab', 'value': ['funk'] }
					},
					{	'target': 'a',
						'operation': {'op':'add', 'path':'zab', 'value': ['funk'] }
					},
					{	'target': 'b',
						'operation': {'op':'add', 'path':'zab', 'value': ['funk'] }
					},
					{	'target': 'c',
						'operation': {'op':'add', 'path':'zab', 'value': ['funk'] }
					}
				],
			"Inverts paths, uses subject as value");
});


QUnit.test( "applytOperations takes an operation object, \
	a JSON object, and applies the operations to the object", function( assert ) {

		var target, ops;

		target = { 'rab': ['funk','skunk','dunk'], 'zab': [ 1, 2 ] };
		ops = {	'target': 'x',
				'operations': [
					{'op':'remove', 'path':'rab', 'value': ['funk'] },
					{'op':'add', 'path':'zab', 'value': ['funk'] }
				]
			};
		operated = vocab.utils.applyOperations(target, ops);
		assert.deepEqual(
			operateds, { 'rab': ['skunk','dunk'], 'zab': [ 1, 2, 'funk' ] },
			"Inverts paths, uses subject as value");
});