'use strict';

// Constants
const NoMidiPortValue = "None";

jvtool.midi = (function() {
	var my = {};

	// WebMIDI objects
	var m = null;
	var midiIn = null;
	var midiOut = null;
	var controllerIn = null;
	var midiInPorts = [];
	var midiOutPorts = [];

	// MIDI settings
	var channel = 0;
	var midiEcho = false;

	

	// Sysex event handler
	my.onSysex = null;


	///// Initialization

	my.initialize = function(onSuccess, onFail) {
	    var options = {sysex: true}; // we need sysex access
		navigator.requestMIDIAccess(options).then(
			function(midiAccess) {
				console.log("WebMIDI supported.");
				m = midiAccess;
				midiAccess.inputs.forEach(port => midiInPorts.push(port));
				midiAccess.outputs.forEach(port => midiOutPorts.push(port));				
				if (onSuccess) onSuccess();
			},
			function(error) {
				console.log("WebMIDI not supported: " + error.name);
				if (onFail) onFail();
			}
		);
	};


	///// MIDI settings/state

	my.useMidiIn = function(portName) {
		if (midiIn) midiIn.onmidimessage = null;
		var port = my.getInPort(portName);
		if (port) {
			midiIn = port;
			midiIn.onmidimessage = message => onMessage(this, message);
			console.log("Using MIDI in: " + portName);
		}
		else console.log("MIDI port not available");
	};

	my.useMidiOut = function(portName) {
		my.sendAllNotesOff(); // Turn off all notes playing on the old port
		var port = my.getOutPort(portName);
		if (port) {
			midiOut = port;
			console.log("Using MIDI out: " + portName);
		}
		else console.log("MIDI port not available");
	};

	my.useControllerIn = function(portName) {
		// Remove any existing listener
		if (controllerIn) controllerIn.onmidimessage = null;
		var port = my.getInPort(portName);
		if (port) {
			controllerIn = port;
			controllerIn.onmidimessage = message => onMessage(this, message);
			console.log("Using MIDI controller in: " + portName);
		}
		else showError("MIDI port not available");
	};


	///// Utility functions

	my.getInNames = () =>
		midiInPorts.map(port => port.name);

	my.getOutNames = () =>
		midiOutPorts.map(port => port.name);

	my.getInPort = (portName) =>
		midiInPorts.find(port => port.name === portName);

	my.getOutPort = (portName) =>
		midiOutPorts.find(port => port.name === portName);

	my.listPorts = function() {
		midiInPorts.forEach(port => console.log("In: " + port.name));
		midiOutPorts.forEach(port => console.log("Out: " + port.name));
	};


	///// MIDI out

	my.sendMessage = function(bytes) {
		console.log('Sent: [' + jvtool.util.toHexStrings(bytes) + ']');
		if (!midiOut) return;
		midiOut.send(bytes);
	};

	my.sendProgramChange = function(program) {
		my.sendMessage([0xc0+channel, program]);
	};

	my.sendBankChange = function(bankMsb, bankLsb) {
		my.sendMessage([0xb0+channel, 0x00, bankMsb]);
		my.sendMessage([0xb0+channel, 0x20, bankLsb]);
	};

	my.sendProgramBankChange = function(program, bankMsb, bankLsb) {
		// Special case: For banks with more than 128 programs,
		// increment the bank LSB and subtract 128 from program #:
		if (program > 127) {
			program -= 127;
			bankLsb++;
		}
		my.sendProgramChange(program);
		my.sendBankChange(bankMsb, bankLsb);
	};

	my.sendAllNotesOff = function() {
		for (var chan = 0; chan < 16; chan++) {
			my.sendMessage([0xb0+chan, 123, 0]);
		}
	};


	///// MIDI input handler

	function onMessage(midi, event) {
		console.log('Received: [' + jvtool.util.toHexStrings(event.data) + ']');
		if (event.data[0] == 0xf0) {
			if (my.onSysex) {
				my.onSysex(event.data);
			}
		}
		// TODO: Echo only MIDI events from controller input
		else if (midiOut) {
			// Echo message
			my.sendMessage(event.data);
		}
	}

	return my;
})();




// var Midi = function() {
// 	// WebMIDI objects
// 	this.m = null;
// 	this.midiIn = null;
// 	this.midiOut = null;
// 	this.controllerIn = null;

// 	this.midiInPorts = [];
// 	this.midiOutPorts = [];

// 	// MIDI settings
// 	this.channel = 0;
// 	this.midiEcho = false;

// 	// Constants
// 	this.NoMidiPortValue = "None";

// 	// Sysex event handler
// 	this.onSysex = null;
// }


// // Initialization

// Midi.prototype.initialize = function(onSuccess, onFail) {
//     var that = this;
//     var options = {sysex: true}; // we need sysex access
// 	navigator.requestMIDIAccess(options).then(
// 		function(midiAccess) {
// 			console.log("WebMIDI supported.");
			
// 			that.m = midiAccess;
// 			midiAccess.inputs.forEach(port => that.midiInPorts.push(port));
// 			midiAccess.outputs.forEach(port => that.midiOutPorts.push(port));
			
// 			that.listPorts();
// 			if (onSuccess) { onSuccess(); }
// 		},
// 		function(error) {
// 			console.log("WebMIDI not supported: " + error.name);
// 			if (onFail) { onFail(); }
// 		}
// 	);
// }

// Midi.prototype.listPorts = function() {
// 	this.midiInPorts.forEach(port => console.log("In: " + port.name));
// 	this.midiOutPorts.forEach(port => console.log("Out: " + port.name));
// }


// // MIDI settings/state

// Midi.prototype.useMidiIn = function(portName) {
// 	var port = this.getInPort(portName);

// 	// Remove any existing listener
// 	if (this.midiIn) {
// 		this.midiIn.onmidimessage = null;
// 	}

// 	if (port) {
// 		this.midiIn = port;
// 		this.midiIn.onmidimessage = message => this.onMessage(this,message);
// 		console.log("Using MIDI in: " + portName);
// 	} else {
// 		showError("MIDI port not available");
// 	}	
// }

// Midi.prototype.useMidiOut = function(portName) {
// 	var port = this.getOutPort(portName);

// 	this.sendAllNotesOff(); // To avoid stuck notes

// 	if (port) {
// 		this.midiOut = port;
// 		console.log("Using MIDI out: " + portName);
// 	} else {
// 		showError("MIDI port not available");
// 	}
// }

// Midi.prototype.useControllerIn = function(portName) {
// 	var port = this.getInPort(portName);

// 	// Remove any existing listener
// 	if (this.controllerIn) {
// 		this.controllerIn.onmidimessage = null;
// 	}

// 	if (port) {
// 		this.controllerIn = port;
// 		this.controllerIn.onmidimessage = message => this.onMessage(this,message);
// 		console.log("Using MIDI controller in: " + portName);
// 	} else {
// 		showError("MIDI port not available");
// 	}	
// }


// // MIDI out

// Midi.prototype.sendMessage = function(bytes) {
// 	console.log('Sent: [' + toHexStrings(bytes) + ']');
// 	if (!this.midiOut) {
// 		return;
// 	}
// 	this.midiOut.send(bytes);
// }

// Midi.prototype.sendProgramChange = function(program) {
// 	this.sendMessage([0xc0+this.channel, program]);
// }

// Midi.prototype.sendBankChange = function(bankMsb, bankLsb) {
// 	this.sendMessage([0xb0+this.channel, 0x00, bankMsb]);
// 	this.sendMessage([0xb0+this.channel, 0x20, bankLsb]);
// }

// Midi.prototype.sendProgramBankChange = function(program, bankMsb, bankLsb) {
// 	// Special case: For banks with more than 128 programs,
// 	// increment the bank LSB and subtract 128 from program #:
// 	if (program > 127) {
// 		program -= 127;
// 		bankLsb++;
// 	}
// 	this.sendProgramChange(program);
// 	this.sendBankChange(bankMsb, bankLsb);
// }

// Midi.prototype.sendAllNotesOff = function() {
// 	for (var chan = 0; chan < 16; chan++) {
// 		this.sendMessage([0xb0+chan, 123, 0]);
// 	}
// }


// // Utility functions

// Midi.prototype.available = function() {
// 	return this.m;
// }

// Midi.prototype.getInNames = function() {
// 	return this.midiInPorts.map(port => port.name);
// }

// Midi.prototype.getOutNames = function() {
// 	return this.midiOutPorts.map(port => port.name);
// }

// Midi.prototype.getInPort = function(portName) {
// 	return this.midiInPorts.find(port => port.name === portName);
// }

// Midi.prototype.getOutPort = function(portName) {
// 	return this.midiOutPorts.find(port => port.name === portName);
// }


// // MIDI input handler

// Midi.prototype.onMessage = function(midi, event) {
// 	console.log('Received: [' + toHexStrings(event.data) + ']');

// 	if (event.data[0] == 0xf0) {
// 		if (this.onSysex) {
// 			this.onSysex(event.data);
// 		}
// 	}

// 	// TODO: Echo only MIDI events from controller input

// 	else if (this.midiOut) {
// 		// Echo message
// 		this.sendMessage(event.data);
// 	}
// }


// Utils

