'use strict';

var SysexHandler = function(midi) {
	this.m = midi;

	// For keeping track of our current request
	this.requestType = null;
	this.requestData = null;
	this.timeoutID = null;

	// Success callback
	//  eventName: "IdentityReply", data: -
	//  eventName: "UserPatchRequest", data: Patch
	this.onSuccess = null; 

	// Failure callback
	//  eventName: "Timeout"
	//  eventName: "UnexpectedResponse"
	//  eventName: "UnexpectedAddress"
	//  eventName: "InvalidChecksum"
	//  eventName: "Unsupported"
	this.onFail = null;

	// Handle this MIDI's sysex data:
	this.m.onSysex = this.onData.bind(this);
}


// Requests

SysexHandler.prototype.sendIdentityRequest = function(onSuccess, onFail) {
	this.initRequest("IdentityRequest", onSuccess, onFail, 200);
	this.m.sendMessage([0xf0,0x7e,0x10,0x06,0x01,0xf7]);
}

SysexHandler.prototype.sendUserPatchRequest = function(onSuccess, onFail, patchNumber) {
	this.initRequest("UserPatchRequest", onSuccess, onFail, 1000);
	this.requestData = {
		baseAddress: 0x11000000 + 0x00010000 * patchNumber
	};
	this.sendDataRequest(this.requestData.baseAddress, patchCommonSize);
}


// Event handlers

SysexHandler.prototype.onData = function(data) {
	console.log("SysexHandler.onData");
	
	// Identity Reply message
	if (midiUtil.startsWith(data, [0xf0, 0x7e, 0x10, 0x06, 0x02, 0x41, 0x6A, 0x00, 0x05])) {
		this.success("IdentityReply", null);
	}

	// Data Set message
	else if (midiUtil.startsWith(data, [0xf0, 0x41, 0x10, 0x6a, 0x12])) {
		this.processDataRequest(data);
	}

	// Something else that we don't support...
	else this.fail("Unsupported");
}

SysexHandler.prototype.onTimeout = function() {
	this.clearRequest();
	this.fail("Timeout");
}


// Internal

SysexHandler.prototype.initRequest = function(requestType, onSuccess, onFail, timeout) {
	this.requestType = requestType;
	this.onSuccess = onSuccess;
	this.onFail = onFail;
	this.timeoutId = window.setTimeout(this.onTimeout.bind(this), timeout);
}


SysexHandler.prototype.clearRequest = function() {
	if (this.timeoutId) {
		window.clearTimeout(this.timeoutId);
		this.timeoutId = null;
	}
	this.requestType = null;
	this.requestData = null;
}

SysexHandler.prototype.success = function(eventName, data) {
	this.clearRequest();
	if (this.onSuccess) {
		this.onSuccess(eventName, data);
	}
	this.onSuccess = null;
	this.onFail = null;
}

SysexHandler.prototype.fail = function(eventName) {
	this.clearRequest();
	if (this.fail) {
		this.onFail(eventName);
	}
	this.onSuccess = null;
	this.onFail = null;
}

SysexHandler.prototype.sendDataRequest = function(address, size) {
	var command = [0x41, 0x10, 0x6a, 0x11];
	var address = midiUtil.addressToBytes(address);
	var size = midiUtil.sizeToBytes(size);
	var data = address.concat(size);
	var checksum = midiUtil.getChecksum(data);
	var bytes = [].concat(0xf0, command, data, checksum, 0xf7);
	this.m.sendMessage(bytes);
}

// Process a (usually multi-part) data request.
SysexHandler.prototype.processDataRequest = function(bytes) {
	console.assert(bytes.length >= 15);
	if (this.requestType == "UserPatchRequest")
	{
		var address = bytes.slice(5, 9);
		var data = bytes.slice(9, bytes.length-2);
		var dataAndAddress = bytes.slice(5, bytes.length-2);
		var checksum = bytes[bytes.length-2];
		var eox = bytes[bytes.length-1];

		// Sanity checks
		if (address[0] !== 0x11 || address[1] >= 0x80) { // User patches at 0x11000000 - 0x11800000
			this.fail("UnexpectedAddress");
			return;
		}
		if (eox !== 0xf7) {
			this.fail("UnexpectedResponse");
			return;
		}
		if (checksum !== midiUtil.getChecksum(dataAndAddress))
		{
			this.fail("InvalidChecksum");
			return;
		}

		switch (address[2]) {
			case 0x00: // Patch Common
				this.requestData.patchNumber = address[1];
				this.requestData.patch = new Patch();
				this.requestData.patch.common = new PatchCommon(data);
				this.sendDataRequest(this.requestData.baseAddress + 0x1000, patchToneSize); // request tone 1
				break;
			case 0x10: // Tone 1
				this.requestData.patch.tones[0].data = new PatchTone(data);
				this.sendDataRequest(this.requestData.baseAddress + 0x1200, patchToneSize); // request tone 2
				break;
			case 0x12: // Tone 2
				this.requestData.patch.tones[1].data = new PatchTone(data);
				this.sendDataRequest(this.requestData.baseAddress + 0x1400, patchToneSize); // request tone 3
				break;
			case 0x14: // Tone 3
				this.requestData.patch.tones[2].data = new PatchTone(data);
				this.sendDataRequest(this.requestData.baseAddress + 0x1600, patchToneSize); // request tone 4
				break;
			case 0x16: // Tone 4
				this.requestData.patch.tones[3].data = new PatchTone(data);
				this.success("UserPatchRequest", this.requestData.patch); // we're done!
				break;
			default:
				this.fail("UnexpectedAddress");
				return;		
		}
	}
}
