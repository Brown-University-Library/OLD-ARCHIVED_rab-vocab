QUnit.test( "arrayDiff should return an object \
	with missing and additional items", function( assert ) {
		var arr1, arr2, diff;

		arr1 = [ 'foo', 'bar', 3 ];
		arr2 = [ 1, 2, 3, ];

		diff = vocab.utils.arrayDiff(arr1, arr2);
		assert.deepEqual(
			diff['add'], [ 1, 2 ], "Added data in obj['add']");
		assert.deepEqual(
			diff['remove'], [ 'foo', 'bar' ], "Removed data in obj['remove']");
});

QUnit.test( "arrayMapDiff should return an object \
	with missing and additional items", function( assert ) {
		var map1, map2, diff;

		arr1 = [ 'foo', 'bar', 3 ];
		arr2 = [ 1, 2, 3, ];

		diff = vocab.utils.arrayDiff(arr1, arr2);
		assert.deepEqual(
			diff['add'], [ 1, 2 ], "Added data in obj['add']");
		assert.deepEqual(
			diff['remove'], [ 'foo', 'bar' ], "Removed data in obj['remove']");
});