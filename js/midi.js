'use strict';

var Midi = function() {
	// WebMIDI objects
	this.m = null;
	this.midiIn = null;
	this.midiOut = null;
	this.midiInPorts = [];
	this.midiOutPorts = [];

	// MIDI settings
	this.channel = 0;
	this.midiEcho = false;

	// Constants
	this.NoMidiPortValue = "None";
}


// Initialization

Midi.prototype.initialize = function(onSuccess, onFail) {
    // TODO: Request sysex access!!
    var that = this;
    var options = {sysex: true};
    //options.sysex = true;
    //options['sysex'] = true;

	navigator.requestMIDIAccess(options).then(
		function(midiAccess) {
			console.log("WebMIDI supported.");
			
			that.m = midiAccess;
			midiAccess.inputs.forEach(port => that.midiInPorts.push(port));
			midiAccess.outputs.forEach(port => that.midiOutPorts.push(port));
			
			that.listPorts();
			if (onSuccess) { onSuccess(); }
		},
		function(error) {
			console.log("WebMIDI not supported: " + error.name);
			if (onFail) { onFail(); }
		}
	);
}

Midi.prototype.listPorts = function() {
	this.midiInPorts.forEach(port => console.log("In: " + port.name));
	this.midiOutPorts.forEach(port => console.log("Out: " + port.name));
}


// MIDI settings/state

Midi.prototype.useMidiIn = function(portName) {
	var port = this.getInPort(portName);

	// Remove any existing listener
	if (this.midiIn) {
		this.midiIn.onmidimessage = null;
	}

	if (port) {
		this.midiIn = port;
		this.midiIn.onmidimessage = message => this.onMessage(this,message);
		console.log("Using MIDI in: " + portName);
	} else {
		showError("MIDI port not available");
	}	
}

Midi.prototype.useMidiOut = function(portName) {
	var port = this.getOutPort(portName);

	this.sendAllNotesOff(); // To avoid stuck notes

	if (port) {
		this.midiOut = port;
		console.log("Using MIDI out: " + portName);
	} else {
		showError("MIDI port not available");
	}
}

Midi.prototype.setMidiEcho = function(enabled) {
	if (enabled) {
		console.log("MIDI echo on");
		this.midiEcho = true;
	} else {
		console.log("MIDI echo off");
		this.sendAllNotesOff(); // To avoid stuck notes
		this.midiEcho = false;
	}
}


// MIDI out

Midi.prototype.sendMessage = function(bytes) {
	console.log('Sent: [' + toHexStrings(bytes) + ']');
	if (!this.midiOut) {
		return;
	}
	this.midiOut.send(bytes);
}

Midi.prototype.sendProgramBankChange = function(program, bankMsb, bankLsb) {
	// Special case: For banks with more than 128 programs,
	// increment the bank LSB and subtract 128 from program #:
	if (program > 127) {
		program -= 127;
		bankLsb++;
	}

	this.sendMessage([0xb0+this.channel, 0x00, bankMsb]); // Bank select MSB
	this.sendMessage([0xb0+this.channel, 0x20, bankLsb]); // Bank select LSB
	this.sendMessage([0xc0+this.channel, program]); // Program change
}

Midi.prototype.sendAllNotesOff = function() {
	for (var chan = 0; chan < 16; chan++) {
		this.sendMessage([0xb0+chan, 123, 0]);
	}
}



// Utility functions

Midi.prototype.available = function() {
	return this.m;
}

Midi.prototype.getInNames = function() {
	return this.midiInPorts.map(port => port.name);
}

Midi.prototype.getOutNames = function() {
	return this.midiOutPorts.map(port => port.name);
}

Midi.prototype.getInPort = function(portName) {
	return this.midiInPorts.find(port => port.name === portName);
}

Midi.prototype.getOutPort = function(portName) {
	return this.midiOutPorts.find(port => port.name === portName);
}


// MIDI input handler

Midi.prototype.onMessage = function(midi,event) {
	console.log('Received: [' + toHexStrings(event.data) + ']');

	// Echo MIDI message?
	if (this.midiEcho && this.midiOut) {
		this.sendMessage(event.data);
	}
}
