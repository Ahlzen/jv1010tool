var midiIn = null;
var midiOut = null;
var channel = 0; // MIDI channel

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



function midiProgramBankChange(program, bankMsb, bankLsb) {
	// Special case: For banks with more than 128 programs,
	// increment the bank LSB and subtract 128 from program#:
	if (program > 127) {
		program -= 127;
		bankLsb++;
	}

	midiSend([176+channel, 0, bankMsb]); // Bank select MSB
	midiSend([176+channel, 32, bankLsb]); // Bank select LSB
	midiSend([192+channel, program]); // Program change
}


// MIDI out

function midiSend(data) {
	if (Array.isArray(data)) {
		midiOut.send(data);
	} else {
		midiOut.send([data]);
	}
}