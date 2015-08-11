var SysexHandler = function(midi) {
	this.m = midi;

	// For keeping track of our current request
	this.requestType = null;
	this.requestData = null;
	this.timeoutID = null;

	// Success callback
	//  eventName: "IdentityReply", data: none
	this.onSuccess = null; 

	// Failure callback
	//  eventName: "Timeout"
	//  eventName: "UnexpectedResponse"
	this.onFail = null;

	// Handle this MIDI's sysex data:
	this.m.onSysex = this.onData.bind(this);
}


// Misc requests

SysexHandler.prototype.identityRequest = function(onSuccess, onFail) {
	this.initRequest("IdentityRequest", onSuccess, onFail, 1000);
	midi.sendMessage([0xf0,0x7e,0x10,0x06,0x01,0xf7]);
}


// Data Dump Requests

SysexHandler.prototype.dumpUserPatch = function(onSuccess, onFail, patchNumber) {
	// TODO
}


// Event handlers

SysexHandler.prototype.onData = function(data) {
	console.log("SysexHandler.onData");

	if (this.requestType === 'IdentityRequest') {
		if (this.startsWith(data, [0xf0, 0x7e, 0x10, 0x06, 0x02, 0x41, 0x6A, 0x00, 0x05]))
		{
			// Identity Reply
			this.clearRequest();
			this.success("IdentityReply", null);
		}
		else
		{
			this.fail("UnexpectedResponse");
		}
	}
	else
	{
		this.fail("UnexpectedResponse");
	}
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
	if (this.onSuccess) {
		this.onSuccess(eventName, data);
	}
	this.onSuccess = null;
	this.onFail = null;
}

SysexHandler.prototype.fail = function(eventName) {
	if (this.onFail) {
		this.onFail(eventName);
	}
	this.onSuccess = null;
	this.onFail = null;
}


// Utility functions

SysexHandler.prototype.startsWith = function(data,pattern) {
	if (data.length < pattern.length) return false;
	for (var i = 0; i < pattern.length; i++) {
		if (data[i] !== pattern[i]) return false;
	}
	return true;
}