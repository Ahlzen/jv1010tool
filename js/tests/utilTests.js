QUnit.test("Test buildUint8Array", function(assert) {
	var arr1 = buildUint8Array();
	assert.ok(arr1 instanceof Uint8Array);
	assert.equal(arr1.length, 0);

	var arr2 = buildUint8Array([], 5, [6,7], new Uint8Array([8,9]));
	assert.ok(arr2 instanceof Uint8Array);
	assert.equal(arr2.length, 5);
	assert.equal(arr2[0], 5);
	assert.equal(arr2[1], 6);
	assert.equal(arr2[2], 7);
	assert.equal(arr2[3], 8);
	assert.equal(arr2[4], 9);
});