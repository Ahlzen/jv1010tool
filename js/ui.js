function showError(message) {
	console.log("ERROR: " + message);
	alert(message);
}


// Initialization

function initialize() {
	initializeMidi(onMidiAvailable, onNoMidi);
}

function onMidiAvailable(){
	initializeUI();
}

function onNoMidi() {
	showError("WebMIDI not supported.");
}

function initializeUI() {

	// MIDI port selectors
	$('#midiIn').selectmenu();
	addOption('#midiIn', NoMidiPortValue);
	getMidiInNames().forEach(function(name){
		addOption('#midiIn', name);
	});
	$('#midiIn').change(onMidiInChange);

	$('#midiOut').selectmenu();
	addOption('#midiOut', NoMidiPortValue);
	getMidiOutNames().forEach(function(name){
		addOption('#midiOut', name);
	});
	$('#midiOut').change(onMidiOutChange);
}


// UI utils

function addOption(selector, val) {
	$(selector).append($('<option>', {value: val, text: val}));
}


// Event handlers

function onMidiInChange() {
	var portName = $("#midiIn").val();
	//console.log("Change in port to: " + portName);
	useMidiIn(portName);
}

function onMidiOutChange() {
	var portName = $("#midiOut").val();
	useMidiOut(portName);
}