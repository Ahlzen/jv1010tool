'use strict';

jvtool.app = (function() {
	var my = {};

	// Currently loaded patches (either from
	// file or received through sysex)
	var loadedPatches = null;


	///// Initialization

	my.initialize = function() {
		jvtool.midi.initialize(onMidiAvailable, onNoMidi);
		initializeDragAndDrop();
	};

	function onMidiAvailable(){
		initializeMidiUI();
		readPrefs();	
	}

	function onNoMidi() {
		showError("WebMIDI not supported.");
	}
	
	function initializeMidiUI() {
		// MIDI port selectors
		addOption('#midiIn', NO_MIDI_PORT_VALUE);
		jvtool.midi.getInNames().forEach(name => addOption('#midiIn', name));
		$('#midiIn').change(my.onMidiInChange);

		addOption('#midiOut', NO_MIDI_PORT_VALUE);
		jvtool.midi.getOutNames().forEach(name => addOption('#midiOut', name));
		$('#midiOut').change(my.onMidiOutChange);

		addOption('#controllerIn', NO_MIDI_PORT_VALUE);
		jvtool.midi.getInNames().forEach(name => addOption('#controllerIn', name));
		$('#controllerIn').change(my.onControllerInChange);	

		// Patch list
		$('#patchList').accordion({heightStyle: "fill"});
	    initializePatchList($('#patchListUser'), "User");
	    initializePatchList($('#patchListA'), "Preset A");
	    initializePatchList($('#patchListB'), "Preset B");
	    initializePatchList($('#patchListC'), "Preset C");
	    initializePatchList($('#patchListD'), "Preset D (GM)");
	    initializePatchList($('#patchListE'), "Preset E");
	    initializePatchList($('#patchListSession'), "Session");
	}

	function initializeDragAndDrop() {
		window.fd.logging = false;
		var zone = new FileDrop('fileDropZone', {});
		zone.event('send', function (files) {
		  files.each(function (file) {
		    file.event('done', function (xhr) {
		      alert('Done uploading ' + this.name + ',' +
		            ' response:\n\n' + xhr.responseText);
		    });
		    file.event('error', function (e, xhr) {
		      alert('Error uploading ' + this.name + ': ' +
		            xhr.status + ', ' + xhr.statusText);
		    });
		    file.readData(my.onDroppedData,
		      function (e) { alert('Failed to read file.') },
		      'bin');
		  });
		});
	}

	function readPrefs() {
		var midiInVal = getPrefs('midiIn');
		if (midiInVal) {
			$('#midiIn').val(midiInVal);
			jvtool.midi.useMidiIn(midiInVal);
		}

		var midiOutVal = getPrefs('midiOut');
		if (midiOutVal) {
			$('#midiOut').val(midiOutVal);
			jvtool.midi.useMidiOut(midiOutVal);	
		}

		var controllerInVal = getPrefs('controllerIn');
		if (controllerInVal) {
			$('#controllerIn').val(controllerInVal);
			jvtool.midi.useControllerIn(controllerInVal);
		}
	}

	function initializePatchList(element, bankName) {
		var bank = jvtool.banks[bankName];
		var patchList = bank.patches;

		var bankMsb = bank.msb;
		var bankLsb = bank.lsb;

		var items = '';
		for (var i = 0; i < patchList.length; i++) {
			var patch = patchList[i];
			var action = 'jvtool.midi.sendProgramBankChange(' + i + ',' + bankMsb + ',' + bankLsb + ')';
			items += '<li><span class="number">' + patch.number +
				'</span> <a class="name" href="#"" onclick="' + action + '"">' + patch.name +
				'</a><span class="infobox">' + patch.voices +
				(patch.poly == false ? '<span class="mode">s</span>' : '') +
				'</span></li>';
		};
		element.append(items);
		element.change(function(){
			program = element.val();
			bankMsb = bank.msb;
			bankLsb = bank.lsb;
			console.log("Bank " + bankMsb + " " + bankLsb + ", Program " + program);
			jvtool.midi.sendProgramBankChange(program, bankMsb, bankLsb);
		});
	}


	///// Public event handlers

	my.onMidiInChange = function() {
		var portName = $("#midiIn").val();
		jvtool.midi.useMidiIn(portName);
		setPrefs('midiIn', portName);
	};

	my.onMidiOutChange = function() {
		var portName = $("#midiOut").val();
		jvtool.midi.useMidiOut(portName);
		setPrefs('midiOut', portName)
	};

	my.onControllerInChange = function() {
		var portName = $("#controllerIn").val();
		jvtool.midi.useControllerIn(portName);
		setPrefs('controllerIn', portName)
	};


	my.onSendIdentityRequest = function() {
		jvtool.sysexHandler.sendIdentityRequest(
			(eventName, data) => alert("Sysex success: " + eventName),
			(eventName) => alert("Sysex fail: " + eventName));
	};

	my.onSendUserPatchRequest = function() {
		var patchNumberStr = $("#patchNumber").val();
		var patchNumber = parseInt(patchNumberStr) - 1;
		jvtool.sysexHandler.sendUserPatchRequest(
			(eventName, patches) => {
				var sysex = patches[0].getSysexData();
				console.log('Patch data: [' + jvtool.util.toHexStrings(sysex) + ']');
				saveDataAs(sysex, patches[0].common.PatchName + ".syx");
			},
			(eventName) => alert("Sysex fail: " + eventName),
			patchNumber);
	};

	my.onSendAllUserPatchRequest = function() {
		jvtool.sysexHandler.sendAllUserPatchRequest(
			(eventName, patches) => {
				var sysex = buildUint8Array.apply(this, patches.map(p => p.getSysexData()));
				console.log('All patch data: [' + jvtool.util.toHexStrings(sysex) + ']');
				saveDataAs(sysex, "User Patches.syx");
			},
			(eventName) => alert("Sysex fail: " + eventName),
			patchNumber);	
	};

	my.onDroppedData = function(data) {
		var bytes = new Uint8Array(data); // data is ArrayBuffer
		var parser = new SysexParser();
		parser.parseData(bytes);
		if (parser.errors.length > 0) {
			var message = parser.errors.reduce((p,c) => p + "<br>Error: " + c, "");
			loadedPatches = null;
		} else {
			var message = parser.objects.reduce((p,c,i) =>
				p + "<br><a class='action try' href=\"#\" onClick=\"jvtool.app.onSendLoadedPatchToTemporary(" + i + ");\">try</a>" +
				" <a class='action upload' href=\"#\" onClick=\"jvtool.app.onShowSendPatchDialog(" + i + ");\">send</a>" +
				" Patch: " + (c.number+1) + " " + c.common.PatchName, "")
			loadedPatches = parser.objects;
		}
		$("#fileContents").html(message);
	};

	my.onSendLoadedPatchToTemporary = function(index) {
		my.onSendLoadedPatchToUser(index, TEMPORARY_PATCH);
	};

	my.onShowSendPatchDialog = function(index) {
		var patch = loadedPatches[index].clone();
		$('#sendPatchDialog #sendPatchIndex').val(index);
		$('#sendPatchDialog #sendPatchNumber').val(patch.number+1);
		$('#sendPatchDialog #sendPatchName').html(patch.common.PatchName);
		$('#sendPatchDialog').show();
	};

	my.onSendLoadedPatchToUser = function(index, userPatchNumber) {
		// TODO: Range checks
		var patch = loadedPatches[index].clone();
		patch.number = userPatchNumber;
		var sysex = patch.getSysexData();
		jvtool.midi.sendMessage(sysex);
	};


	///// Helpers

	function showError(message) {
		console.log("ERROR: " + message);
		$("#errors").html(message);
	}

	function addOption(selector, val, txt) {
		$(selector).append($('<option>', {value: val, text: txt || val}));
	}

	function saveDataAs(data, filename) {
		var blob = new Blob([data], {type: "application/octet-binary"});
		saveAs(blob, filename);
	}


	return my;
})();
