function showError(message) {
	console.log("ERROR: " + message);
	alert(message);
}


// Initialization

function initializeApp() {
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

	//$('#midiIn').selectmenu();
	addOption('#midiIn', NoMidiPortValue);
	getMidiInNames().forEach(function(name){
		addOption('#midiIn', name);
	});
	$('#midiIn').change(onMidiInChange);

	//$('#midiOut').selectmenu();
	addOption('#midiOut', NoMidiPortValue);
	getMidiOutNames().forEach(function(name){
		addOption('#midiOut', name);
	});
	$('#midiOut').change(onMidiOutChange);


	// Patch list
	$('expandAllPatches').button().click(onExpandAllPatches);
	$('collapseAllPatches').button().click(onCollapseAllPatches);

	$('#patchList').accordion({
      heightStyle: "fill"
    });
	$('#patchListUser').attr('size', UserPatches.length);
	for (var i = 0; i < UserPatches.length; i++) {
		var patch = UserPatches[i];
		addOption('#patchListUser', i, patch.number + " " + patch.name );
	};
}



// UI utils

function addOption(selector, val, txt) {
	$(selector).append($('<option>', {value: val, text: txt || val}));
}


// Event handlers

function onMidiInChange() {
	var portName = $("#midiIn").val();
	useMidiIn(portName);
}

function onMidiOutChange() {
	var portName = $("#midiOut").val();
	useMidiOut(portName);
}

function onExpandAllPatches() {
}

function onCollapseAllPatches() {
}