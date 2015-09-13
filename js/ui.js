'use strict';

var midi = new Midi();
var sysex = new SysexHandler(midi);
var loadedPatches = null;

function showError(message) {
	console.log("ERROR: " + message);
	$("#errors").html(message);
}


// Initialization

function initializeApp() {
	midi.initialize(onMidiAvailable, onNoMidi);
	initializeDragAndDrop();
}

function onMidiAvailable(){
	initializeMidiUI();
	readPrefs();	
}

function onNoMidi() {
	// TODO: Show error in UI
	showError("WebMIDI not supported.");
}


function initializeMidiUI() {

	// MIDI port selectors

	//$('#midiIn').selectmenu();
	addOption('#midiIn', midi.NoMidiPortValue);
	midi.getInNames().forEach(name => addOption('#midiIn', name));
	$('#midiIn').change(onMidiInChange);

	//$('#midiOut').selectmenu();
	addOption('#midiOut', midi.NoMidiPortValue);
	midi.getOutNames().forEach(name => addOption('#midiOut', name));
	$('#midiOut').change(onMidiOutChange);

	addOption('#controllerIn', midi.NoMidiPortValue);
	midi.getInNames().forEach(name => addOption('#controllerIn', name));
	$('#controllerIn').change(onControllerInChange);	

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
	var options = {iframe: {url: 'upload.php'}};
	var zone = new FileDrop('zbasic', options);

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
	    file.readData(onDroppedData,
	      function (e) { alert('Failed to read file.') },
	      'bin');
	  });
	});
	// <iframe> uploads are special - handle them.
	zone.event('iframeDone', function (xhr) {
	  alert('Done uploading via <iframe>, response:\n\n' + xhr.responseText);
	});
	// Toggle multiple file selection in the File Open dialog.
	fd.addEvent(fd.byID('zbasicm'), 'change', function (e) {
	  zone.multiple((e.currentTarget || e.srcElement).checked);
	});
}

function readPrefs() {
	var midiInVal = getPrefs('midiIn');
	if (midiInVal) {
		$('#midiIn').val(midiInVal);
		midi.useMidiIn(midiInVal);
	}

	var midiOutVal = getPrefs('midiOut');
	if (midiOutVal) {
		$('#midiOut').val(midiOutVal);
		midi.useMidiOut(midiOutVal);	
	}

	var controllerInVal = getPrefs('controllerIn');
	if (controllerInVal) {
		$('#controllerIn').val(controllerInVal);
		midi.useControllerIn(controllerInVal);
	}
}


function initializePatchList(element, bankName) {
	var bank = Banks[bankName];
	var patchList = bank.patches;

	var bankMsb = bank.msb;
	var bankLsb = bank.lsb;

	var items = '';
	for (var i = 0; i < patchList.length; i++) {
		var patch = patchList[i];
		var action = 'midi.sendProgramBankChange(' + i + ',' + bankMsb + ',' + bankLsb + ')';
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
		midi.sendProgramBankChange(program, bankMsb, bankLsb);
	});
}


// UI utils

function addOption(selector, val, txt) {
	$(selector).append($('<option>', {value: val, text: txt || val}));
}

function saveDataAs(data, filename) {
	var blob = new Blob([data], {type: "application/octet-binary"});
	saveAs(blob, filename);
}


// Event handlers

function onMidiInChange() {
	var portName = $("#midiIn").val();
	midi.useMidiIn(portName);
	setPrefs('midiIn', portName);
}

function onMidiOutChange() {
	var portName = $("#midiOut").val();
	midi.useMidiOut(portName);
	setPrefs('midiOut', portName)
}

function onControllerInChange() {
	var portName = $("#controllerIn").val();
	midi.useControllerIn(portName);
	setPrefs('controllerIn', portName)
}

function onSendIdentityRequest() {
	sysex.sendIdentityRequest(
		(eventName, data) => alert("Sysex success: " + eventName),
		(eventName) => alert("Sysex fail: " + eventName));
}

function onSendUserPatchRequest() {
	var patchNumberStr = $("#patchNumber").val();
	var patchNumber = parseInt(patchNumberStr) - 1;
	sysex.sendUserPatchRequest(
		(eventName, patches) => {
			var sysex = patches[0].getSysexData();
			console.log('Patch data: [' + toHexStrings(sysex) + ']');
			saveDataAs(sysex, patches[0].common.PatchName + ".syx");
		},
		(eventName) => alert("Sysex fail: " + eventName),
		patchNumber);
}

function onSendAllUserPatchRequest() {
	sysex.sendAllUserPatchRequest(
		(eventName, patches) => {
			var sysex = buildUint8Array.apply(this, patches.map(p => p.getSysexData()));
			console.log('All patch data: [' + toHexStrings(sysex) + ']');
			saveDataAs(sysex, "User Patches.syx");
		},
		(eventName) => alert("Sysex fail: " + eventName),
		patchNumber);	
}

function onDroppedData(data) {
	var bytes = new Uint8Array(data); // data is ArrayBuffer
	var parser = new SysexParser();
	parser.parseData(bytes);
	if (parser.errors.length > 0) {
		var message = parser.errors.reduce((p,c) => p + "<br>Error: " + c, "");
		loadedPatches = null;
	} else {
		var message = parser.objects.reduce((p,c,i) =>
			p + "<br>Patch: " + c.number + " " + c.common.PatchName +
			" <a href=\"#\" onClick=\"onSendLoadedPatch(" + i + ");\">try</a>", "")
		loadedPatches = parser.objects;
	}
	$("#fileContents").html(message);
}

function onSendLoadedPatch(index) {
	var patch = loadedPatches[index].clone();
	patch.number = TEMPORARY_PATCH;
	var sysex = patch.getSysexData();
	midi.sendMessage(sysex);
}
