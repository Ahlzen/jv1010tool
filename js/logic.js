var midiIn = null;
var midiOut = null;
var channel = 0; // MIDI channel
var midiEcho = false;

// Constants

var NoMidiPortValue = "None";


// MIDI input handler

function onMidiMessage(event) {
	console.log('Received: [' + toHexStrings(event.data) + ']');

	if (midiEcho && midiOut) {
		// Echo MIDI data
		midiSend(event.data);
	}
}


// MIDI state

function useMidiIn(portName) {
	var port = getMidiInPort(portName);

	// Remove any existing listener
	if (midiIn) {
		midiIn.onmidimessage = null;
	}

	if (port) {
		midiIn = port;
		midiIn.onmidimessage = onMidiMessage;
		console.log("Using MIDI in: " + portName);
	} else {
		showError("MIDI port not available");
	}	
}

function useMidiOut(portName) {
	var port = getMidiOutPort(portName);

	// Silence to avoid notes getting stuck
	midiAllNotesOff();

	if (port) {
		midiOut = port;
		console.log("Using MIDI out: " + portName);
	} else {
		showError("MIDI port not available");
	}
}

function setMidiEcho(enabled) {
	if (enabled) {
		midiEchoOn();
	} else {
		midiEchoOff();
	}
}

function midiEchoOn() {
	console.log("MIDI echo on");
	midiEcho = true;
}

function midiEchoOff() {
	console.log("MIDI echo off");
	// Silence to avoid notes getting stuck
	midiAllNotesOff();
	midiEcho = false;
}


// MIDI out

function midiSend(data) {
	console.log('Sent: [' + toHexStrings(data) + ']');
	if (!midiOut) {
		return;
	}
	midiOut.send(data);
	
	// if (Array.isArray(data)) {
	// 	midiOut.send(data);
	// } else {
	// 	midiOut.send([data]);
	// }
}

function midiProgramBankChange(program, bankMsb, bankLsb) {
	// Special case: For banks with more than 128 programs,
	// increment the bank LSB and subtract 128 from program #:
	if (program > 127) {
		program -= 127;
		bankLsb++;
	}

	midiSend([0xb0+channel, 0x00, bankMsb]); // Bank select MSB
	midiSend([0xb0+channel, 0x20, bankLsb]); // Bank select LSB
	midiSend([0xc0+channel, program]); // Program change
}

function midiAllNotesOff() {
	for (var chan = 0; chan < 16; chan++) {
		midiSend([0xb0+chan, 123, 0]);
	}
}


// Utility/debug

function toHexStrings(data) {
	//return data.map(function(d){return d.toString(16);});
	// Ugly, but works with both Uint8Array and Array:
	var arr = [];
	for (var i = 0; i < data.length; i++) {
		arr.push(data[i].toString(16));
	}
	return arr;
}



