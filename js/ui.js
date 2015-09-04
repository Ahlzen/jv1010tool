'use strict';

var midi = new Midi();
var sysex = new SysexHandler(midi);

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
		(eventName, patch) => {
			var sysex = patch.getSysexData();
			console.log('Patch data: [' + toHexStrings(sysex) + ']');
			saveDataAs(sysex, patch.common.PatchName + ".syx");
		},
		(eventName) => alert("Sysex fail: " + eventName),
		patchNumber);
}

function onDroppedData(data) {
	var bytes = new Uint8Array(data); // data is ArrayBuffer
	var parser = new SysexParser();
	parser.parse(bytes);
	var message = "Contents:\n";
	parser.errors.map(e =>
		message += "Error: " + e + "\n");
	parser.objects.map(o =>
		message += "Patch " + o.number + ": " + o.common.PatchName + "\n");
	$("#fileContents").html(message);
}
