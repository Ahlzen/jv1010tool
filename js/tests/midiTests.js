QUnit.test("Test getChecksum", function(assert) {
	// Example 1 from the JV-1010 midi reference
	var testData = [0x01, 0x00, 0x00, 0x28, 0x06];
	assert.equal(midiUtil.getChecksum(testData), 0x51);

	// Example 2 from the JV-1010 midi reference
	testData = [0x10, 0x02, 0x12, 0x00, 0x00, 0x00, 0x00, 0x19];
	assert.equal(midiUtil.getChecksum(testData), 0x43);
});

QUnit.test("Test addressToBytes", function(assert) {
	var address = 0x236f0133;
	var bytes = midiUtil.addressToBytes(address);
	assert.equal(4, bytes.length);
	assert.equal(0x23, bytes[0]);
	assert.equal(0x6f, bytes[1]);
	assert.equal(0x01, bytes[2]);
	assert.equal(0x33, bytes[3]);
});

QUnit.test("Test sizeToBytes", function(assert) {
	var address = 130;
	var bytes = midiUtil.sizeToBytes(address);
	assert.equal(4, bytes.length);
	assert.equal(0x00, bytes[0]);
	assert.equal(0x00, bytes[1]); 
	assert.equal(0x01, bytes[2]); // 130/128
	assert.equal(0x02, bytes[3]); // 130-128
});

QUnit.test("Test startsWith", function(assert) {
	assert.ok(midiUtil.startsWith([],[]));
	assert.ok(midiUtil.startsWith([1],[1]));
	assert.ok(midiUtil.startsWith([1,2,3,4,5],[]));
	assert.ok(midiUtil.startsWith([1,2,3,4,5],[1,2,3]));

	assert.notOk(midiUtil.startsWith([1,2,3],[1,2,3,4,5]));
	assert.notOk(midiUtil.startsWith([1,2,3,4,5],[2,3]));
});

