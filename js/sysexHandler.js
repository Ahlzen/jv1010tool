'use strict';

var SysexHandler = function(midi) {
	this.m = midi;

	// For keeping track of our current request
	this.requestType = null;
	this.requestData = null;
	this.timeoutID = null;

	// Queue of [address,size] data requests
	this.dataRequestQueue = [];
	

	// Success callback
	//  eventName: "IdentityReply", data: -
	//  eventName: "UserPatchRequest", data: [Patch]
	//  eventName: "AllUserPatchRequest", data: [Patch1, Patch2, ...]
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
	this.pushPatchRequest(patchNumber);
	this.initRequest("UserPatchRequest", onSuccess, onFail, 1000);
	this.processDataRequestQueue();
}

SysexHandler.prototype.sendAllUserPatchRequest = function(onSuccess, onFail) {
	_.range(128).forEach(n => this.pushPatchRequest(n));	
	this.initRequest("AllUserPatchRequest", onSuccess, onFail, 60000); // should take well under a minute
	this.processDataRequestQueue();
}


// Internal: Event handlers

SysexHandler.prototype.onData = function(data) {
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



// Internal: Data request queue

SysexHandler.prototype.pushPatchRequest = function(patchNumber) {
	var baseAddress = 0x11000000+0x10000*patchNumber;
	this.dataRequestQueue.push([baseAddress, patchCommonSize]);
	this.dataRequestQueue.push([baseAddress+0x1000, patchToneSize]);
	this.dataRequestQueue.push([baseAddress+0x1200, patchToneSize]);
	this.dataRequestQueue.push([baseAddress+0x1400, patchToneSize]);
	this.dataRequestQueue.push([baseAddress+0x1600, patchToneSize]);
}

// Process next entry in the data request queue
SysexHandler.prototype.processDataRequestQueue = function() {
	if (this.dataRequestQueue.length > 0)
	{
		var req = this.dataRequestQueue.shift();
		var address = req[0];
		var size = req[1];
		var command = [0x41, 0x10, 0x6a, 0x11];
		var address = midiUtil.addressToBytes(address);
		size = midiUtil.sizeToBytes(size);
		var data = address.concat(size);
		var checksum = midiUtil.getChecksum(data);
		var bytes = [].concat(0xf0, command, data, checksum, 0xf7);
		this.m.sendMessage(bytes);
	}
	else
	{
		// Empty queue. We're done!
		this.success(this.requestType, this.requestData);
	}
}


// Internal: Misc

SysexHandler.prototype.initRequest = function(requestType, onSuccess, onFail, timeout) {
	this.requestType = requestType;
	this.requestData = [];
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


SysexHandler.prototype.processDataRequest = function(bytes) {
	console.assert(bytes.length >= 15);
	var address = bytes.slice(5, 9);
	var data = bytes.slice(9, bytes.length-2);
	var dataAndAddress = bytes.slice(5, bytes.length-2);
	var checksum = bytes[bytes.length-2];
	var eox = bytes[bytes.length-1];

	// This assumes a User Patch Request.
	// TODO: Handle other data dumps

	// Sanity checks
	if (address[0] !== 0x11 || address[1] >= 0x80) { // User patches at 0x11000000 - 0x11800000
		this.fail("UnexpectedAddress");
		return;
	}
	if (eox !== 0xf7) {
		this.fail("UnexpectedResponse");
		return;
	}
	if (checksum !== midiUtil.getChecksum(dataAndAddress)) {
		this.fail("InvalidChecksum");
		return;
	}

	var patchNumber = address[1];

	switch (address[2]) {
		case 0x00: // Patch Common
			var patch = new Patch();
			patch.number = patchNumber;
			patch.common = new PatchCommon(data);
			this.requestData.push(patch);
			break;
		case 0x10: // Patch Tone 1
		case 0x12: // Patch Tone 2
		case 0x14: // Patch Tone 3
		case 0x16: // Patch Tone 4
			var toneNumber = (address[2] & 0x0f) >> 1;
			console.assert(toneNumber >= 0);
			console.assert(toneNumber <= 3);
			var patch = this.requestData[this.requestData.length-1]
			patch.tones[toneNumber].copyDataFrom(data,0);
			break;
		default:
			this.fail("UnexpectedAddress");
			return;		
	}

	// Send next request (if applicable)
	this.processDataRequestQueue();
}
