'use strict'

jvtool.midiUtil = {
	startsWith: function(data, pattern) {
		if (data.length < pattern.length) return false;
		for (var i = 0; i < pattern.length; i++) {
			if (data[i] !== pattern[i]) return false;
		}
		return true;
	},
	addressToBytes: function(address) {
		// 28-bit address (32-bit notation) to array of bytes
	    return [
	    	(address & 0x7f000000) >> 24,
	    	(address & 0x007f0000) >> 16,
	    	(address & 0x00007f00) >> 8,
	    	 address & 0x0000007f];
	},
	sizeToBytes: function(address) {
		// Int to 28-bit size
	    return [
	    	(address >> 21) & 0x7f,
	    	(address >> 14) & 0x7f,
	    	(address >> 7) & 0x7f,
	    	address & 0x7f];
	},
	getChecksum: function(data) {
	   var sum = data.reduce((p,c,i,a) => p+c, 0);
	   var checksum = (128 - (sum & 0x7f)) & 0x7f;
	   return checksum;
	}
};