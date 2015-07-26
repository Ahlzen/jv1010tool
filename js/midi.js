var midi = null;


// Initialization

function initializeMidi(onSuccess, onFail) {
	midi = null;
	navigator.requestMIDIAccess().then(
		function(midiAccess) {
			console.log("WebMIDI supported.");
			midi = midiAccess;
			listPorts();
			if (onSuccess) { onSuccess(); }
		},
		function (error) {
			console.log("WebMIDI not supported. Error code: " + error.code);
			if (onFail) { onFail(); }
		}
	);

		// onsuccesscallback,
		// onerrorcallback);

}


function listPorts(midiAccess) {
	getMidiInNames().forEach(function(port){
		console.log("In: " + port);});
	getMidiOutNames().forEach(function(port){
		console.log("Out: " + port);});
};


// function onsuccesscallback(midiAccess) {
// 	midi = midiAccess;

// 	// List available midi ports
// 	console.log("WebMIDI supported.");
// 	getMidiInNames.forEach(function(port){
// 		console.log("In: " + port.name);});
// 	getMidiOutNames.forEach(function(port){
// 		console.log("Out: " + port.name);});
// };

// function onerrorcallback(error) {
// 	console.log("WebMIDI not supported. Error code: " + error.code);
// }


// Utility functions

function midiAvailable() {
	return ! (midi == null);
}

function getMidiInNames() {
	return getNames(midi.inputs);
}

function getMidiOutNames() {
	return getNames(midi.outputs);
}

function getNames(ports) {
	var list = [];
	ports.forEach(function(port){
		list.push(port.name);
	});
	return list;
}



// // obsolete
// function midiAvailable() {
// 	if (!midi) {
// 		message( "WebMIDI not supported.");
// 		return false;
// 	}
// 	return true;
// }

// // obsolete
// function listDevices() {
// 	if (!midiAvailable()) return;

// 	message("Inputs:");
// 	var inputs = midi.inputs;
// 	inputs.forEach(function(port){
// 		message(port.name + " (" + port.manufacturer +
// 		", " + port.version + ")");
// 	});

// 	message("Outputs:");
// 	var outputs = midi.outputs;
// 	outputs.forEach(function(port){
// 		message(port.name + " (" + port.manufacturer +
// 		", " + port.version + ")");
// 	});
// }


