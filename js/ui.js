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
    initializePatchList($('#patchListUser'), "User");
}


function initializePatchList(element, bankName) {
	var bank = Banks[bankName];
	var patchList = bank.patches;
	element.attr('size', patchList.length);
	for (var i = 0; i < patchList.length; i++) {
		var patch = patchList[i];
		element.append($('<option>', {value: i, text: patch.number + ' ' + patch.name}));
	};
	element.change(function(){
		program = element.val();
		bankMsb = bank.msb;
		bankLsb = bank.lsb;
		console.log("Bank " + bankMsb + " " + bankLsb + ", Program " + program);
		midiProgramBankChange(program, bankMsb, bankLsb);
	});
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