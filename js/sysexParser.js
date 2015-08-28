'use strict';

var SysexParser = function() {
	this.objects = []; // parsed patches/performances/etc.
	this.errors = []; // error messages
}


// Raw .syx data parsing

SysexParser.prototype.parse = function(data) {
	data = Array.from(data);
	
	// Split into and parse individual sysex messages
	while (data.length > 0) {
		console.assert(data[0] === 0xf0, "Expected start of sysex"); // TODO: real check!
		var end = data.indexOf(0xf7);
		if (end === -1) break;
		var message = data.splice(0, end+1);
		this.parseMessage(message);
	}
}


// Internal

SysexParser.prototype.parseMessage = function(message) {
	console.log("Parsing message. Size: " + message.length);

	var sox = message.shift();
	var eox = message.pop();
	console.assert(sox === 0xf0, "Expected Start-of-exclusive");
	console.assert(eox === 0xf7, "Expected End-of-exclusive");

	if (midiUtil.startsWith(message, [0x41, 0x10, 0x6a, 0x12])) {
		// Data Set message
		message.splice(0, 4); // remove command
		var checksum = message.pop();
		var address = message.slice(0, 4);
		var data = message.slice(4);

		// Verify checksum
		if (checksum !== midiUtil.getChecksum(message)) {
			console.log("Invalid checksum. Expected: " + checksum +
				", was: " + midiUtil.getChecksum(message));
			this.errors.push("InvalidChecksum");
			return;
		}

		// Address determines type of data
		if (address[0] == 0x11) {
			// User Patch
			var patchNumber = address[1];
			var offset = address[3];
			if (address[2] == 0x00) {
				// Patch Common
				var patch = new Patch();
				this.objects.push(patch);
				patch.number = patchNumber;
				patch.common.copyDataFrom(data, offset);
			}
			else if ((address[2] & 0x19) === 0x10) {
				// Patch Tone
				var toneNumber = (address[2] & 0x0f) >> 1;
				var patch = this.objects.find(p => p.number === patchNumber);
				if (patch) {
					patch.tones[toneNumber].copyDataFrom(data, offset);
				} else {
					this.errors.push("PatchNotFound: " + patchNumber +  ", Tone: " + toneNumber);
				}
			}
		} else {
			// TODO: Handle performance data, rhythm setups, scale tune, system common etc.
			this.errors.push("UnsupportedData");
		}
	}
}
