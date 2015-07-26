var midiIn = null;
var midiOut = null;

// Constants

var NoMidiPortValue = "None";




function useMidiIn(portName) {
	var port = getMidiInPort(portName);
	if (port) {
		midiIn = port;
		console.log("Using MIDI in: " + portName);
	} else {
		showError("MIDI port not available");
	}	
}

function useMidiOut(portName) {
	var port = getMidiOutPort(portName);
	if (port) {
		midiOut = port;
		console.log("Using MIDI out: " + portName);
	} else {
		showError("MIDI port not available");
	}
}

