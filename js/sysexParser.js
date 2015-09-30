'use strict';

var SysexParser = function() {
	// May be: "IdentityReply", Patch
	this.objects = []; // parsed objects
	this.errors = []; // error messages
}

SysexParser.prototype.lastError = function() {
	return _.last(this.errors) || null;
}


// Parses raw sysex data,that may contain several
// sysex messages. See this.errors for status.
SysexParser.prototype.parseData = function(data) {
	data = Array.from(data);
	
	// Split into and parse individual sysex messages
	while (data.length > 0) {
		var end = data.indexOf(0xf7);
		if (end === -1) break;
		var message = data.splice(0, end+1);
		this.parseMessage(message);
	}
}

// Parses a single sysex message. Returns true if successful.
// NOTE: message must be Array
SysexParser.prototype.parseMessage = function(message) {
	console.log("Parsing message. Size: " + message.length);

	var sox = message.shift();
	var eox = message.pop();
	if (sox !== 0xf0 || eox !== 0xf7) {
		this.errors.push("UnexpectedResponse");
		return false;
	}

	if (jvtool.midiUtil.startsWith(message, [0x7e, 0x10, 0x06, 0x02, 0x41, 0x6A, 0x00, 0x05]))
	{
		this.objects.push("IdentityReply");
		return true;
	}
	else if (jvtool.midiUtil.startsWith(message, [0x41, 0x10, 0x6a, 0x12]))
	{
		// Data Set message
		message.splice(0, 4); // remove command
		var checksum = message.pop();
		var address = message.slice(0, 4);
		var data = message.slice(4);

		// Verify checksum
		if (checksum !== jvtool.midiUtil.getChecksum(message)) {
			this.errors.push("InvalidChecksum");
			return false;
		}

		// Address determines type of data
		if (address[0] == 0x11)
		{
			// User Patch
			return this.parsePatchData(address, data);
		}
	}
	
	this.errors.push("Unsupported");
	return false;
}


// Internal

SysexParser.prototype.parsePatchData = function(address, data) {
	var patchNumber = address[1];
	switch (address[2]) {
	case 0x00: // Patch common
		var patch = new Patch();
		patch.number = patchNumber;
		patch.common.copyDataFrom(data,0);
		this.objects.push(patch);
		return true;
	case 0x10: // Patch Tone 1
	case 0x12: // Patch Tone 2
	case 0x14: // Patch Tone 3
	case 0x16: // Patch Tone 4
		var toneNumber = (address[2] & 0x0f) >> 1;
		var patch = this.objects[this.objects.length-1]; // assume last object
		patch.tones[toneNumber].copyDataFrom(data,0);
		return true;
	default:
		this.errors.push("UnexpectedAddress");
		return false;
	}
}
