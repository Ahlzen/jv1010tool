'use strict';

jvtool.sysexHandler = (function(midi) {
	var my = {};

	// For keeping track of our current request
	var requestType = null;
	var timeoutId = null;
	var sysexParser = null;

	// Queue of [[addressBytes],size] data requests
	var dataRequestQueue = [];
	
	//  eventName: "IdentityReply", data: -
	//  eventName: "UserPatchRequest", data: [Patch]
	//  eventName: "AllUserPatchRequest", data: [Patch1, Patch2, ...]
	var successCallback = null; 

	//  eventName: "Timeout"
	//  eventName: "UnexpectedResponse"
	//  eventName: "UnexpectedAddress"
	//  eventName: "InvalidChecksum"
	//  eventName: "Unsupported"
	//  eventName: "UnknownError"
	var failureCallback = null;

	// Register to handle all sysex messages
	midi.onSysex = onData.bind(this);


	///// Requests

	my.sendIdentityRequest = function(onSuccess, onFail) {
		initRequest("IdentityRequest", onSuccess, onFail, 200);
		midi.sendMessage([0xf0,0x7e,0x10,0x06,0x01,0xf7]);
	};

	my.sendUserPatchRequest = function(onSuccess, onFail, patchNumber) {
		pushPatchRequest(patchNumber);
		initRequest("UserPatchRequest", onSuccess, onFail, 1000);
		processDataRequestQueue();
	};

	my.sendAllUserPatchRequest = function(onSuccess, onFail) {
		_.range(128).forEach(n => pushPatchRequest(n));	
		initRequest("AllUserPatchRequest", onSuccess, onFail, 60000); // should take well under a minute
		processDataRequestQueue();
	};


	///// Internal: Misc

	function initRequest(requestTypeName, onSuccess, onFail, timeout) {
		requestType = requestTypeName;
		sysexParser = new SysexParser();
		successCallback = onSuccess;
		failureCallback = onFail;
		timeoutId = window.setTimeout(onTimeout.bind(this), timeout);
	}

	function clearRequest() {
		if (timeoutId) {
			window.clearTimeout(timeoutId);
			timeoutId = null;
		}
		requestType = null;
		sysexParser = null;
	}

	function success(eventName, data) {
		clearRequest();
		if (successCallback) {
			successCallback(eventName, data);
		}
		successCallback = null;
		failureCallback = null;
	}

	function fail(eventName) {
		clearRequest();
		if (failureCallback) {
			failureCallback(eventName);
		}
		successCallback = null;
		failureCallback = null;
	}


	///// Internal: Event handlers

	function onData(data)
	{
		if (sysexParser.parseMessage(Array.from(data))) {
			// Send next request (if applicable)
			processDataRequestQueue();
		} else {
			fail(_.last(sysexParser.errors) || "UnknownError");
		}	
	}

	function onTimeout() {
		clearRequest();
		fail("Timeout");
	}


	///// Internal: Data request queue

	function pushPatchRequest(patchNumber) {
		dataRequestQueue.push([PatchCommon.getBaseAddress(patchNumber), PATCH_COMMON_SIZE]);
		dataRequestQueue.push([PatchTone.getBaseAddress(patchNumber, 0), PATCH_TONE_SIZE]);
		dataRequestQueue.push([PatchTone.getBaseAddress(patchNumber, 1), PATCH_TONE_SIZE]);
		dataRequestQueue.push([PatchTone.getBaseAddress(patchNumber, 2), PATCH_TONE_SIZE]);
		dataRequestQueue.push([PatchTone.getBaseAddress(patchNumber, 3), PATCH_TONE_SIZE]);
	}

	// Process next entry in the data request queue
	function processDataRequestQueue() {
		if (dataRequestQueue.length > 0)
		{
			var req = dataRequestQueue.shift();

			// Create data request sysex message
			var address = req[0];
			var size = jvtool.midiUtil.sizeToBytes(req[1]);
			var command = [0x41, 0x10, 0x6a, 0x11];
			var data = address.concat(size);
			var checksum = jvtool.midiUtil.getChecksum(data);
			var bytes = [].concat(0xf0, command, data, checksum, 0xf7);

			midi.sendMessage(bytes);
		}
		else
		{
			// Empty queue. We're done!
			success(requestType, sysexParser.objects);
		}
	}


	return my;
})(jvtool.midi);
