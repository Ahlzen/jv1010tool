'use strict';

var SysexData = function(dataSize, data) {
   if (data) {
      console.assert(data.length === dataSize,
         "Unexpected data size.");
      this.data = Uint8Array.from(data);
   } else {
      this.data = new Uint8Array(dataSize);
   }
}

SysexData.prototype.copyDataFrom = function(data, start) {
   console.assert(start + data.length <= this.data.length, "Data too large.");
   for (var i = 0 ; i < data.length ; i++) {
      this.data[start+i] = data[i];
   }
}


// Internal utility

SysexData.prototype.dataToString = function(start, length) {
   var str = '';
   for (var i = 0 ; i < length ; i++) {
      str += String.fromCharCode(this.cleanAscii(this.data[start+i]));
   }
   return str.trim();
}

SysexData.prototype.stringToData = function(start, length, str) {
   for (var i = 0 ; i < length ; i++) {
      if (i < str.length) {
         this.data[start+i] = this.cleanAscii(str.charCodeAt(i));
      } else {
         this.data[start+i] = 32; // pad with space
      }
   }
}

SysexData.prototype.cleanAscii = function(i) {
   if (i < 32 || i > 125) {
      return 32; // outside valid range for jv-1010
   }
   return i;
}


var PropertyType = Object.freeze({
   "Int": 1, // simple integer value (0-127)
   "LargeInt": 2, // byte value split into two nibbles (0-255)
   "String": 3 // ASCII string
})

function addProperty(obj, data) {
   switch (data[0]) {
      case PropertyType.Int:
         addIntAccessor(obj, data[1], data[2], data[3], data[4]);
         break;
      case PropertyType.LargeInt:
         addLargeIntAccessor(obj, data[1], data[2], data[3], data[4]);
         break;
      case PropertyType.String:
         addStringAccessor(obj, data[1], data[2], data[3]);
         break;
   }
}

function addIntAccessor(obj, offset, min, max, name) {
   Object.defineProperty(obj, name, {
      get: function() { return this.data[offset]; },
      set: function(val) {
         if (val > max) val = max;
         if (val < min) val = min;
         this.data[offset] = val;
      }});
}

function addLargeIntAccessor(obj, offset, min, max, name) {
   Object.defineProperty(PatchCommon.prototype, name, {
      get: function() {
         return this.data[offset] << 4 +
            this.data[offset+1]; },
      set: function(val) {
         if (val > max) val = max;
         if (val < min) val = min;
         this.data[offset] = (val & 0xf0) >> 4;
         this.data[offset+1] = val & 0x0f;
   }});
}

function addStringAccessor(obj, offset, length, name) {
   Object.defineProperty(PatchCommon.prototype, name, {
      get: function() { return this.dataToString(offset,length); },
      set: function(s) { this.stringToData(offset,length,s); }
   });
}


////// PATCH //////

var Patch = function() {
   this.number = 0;
   this.common = new PatchCommon();
   this.tones = [
      new PatchTone(),
      new PatchTone(),
      new PatchTone(),
      new PatchTone()];
}


////// PATCH COMMON //////

var PatchCommon = function(data) {   
   SysexData.call(this, patchCommonSize, data);
}
PatchCommon.prototype = Object.create(SysexData.prototype);
PatchCommon.prototype.constructor = PatchCommon;

const patchCommonSize = 0x4a;
var patchCommonProperties = [
   [PropertyType.String, 0x00, 12, "PatchName"],
   [PropertyType.Int, 0x0c, 0, 39, "EFXType"],
   [PropertyType.Int, 0x0d, 0, 127, "EFXParameter1"],
   [PropertyType.Int, 0x0e, 0, 127, "EFXParameter2"],
   [PropertyType.Int, 0x0f, 0, 127, "EFXParameter3"],
   [PropertyType.Int, 0x10, 0, 127, "EFXParameter4"],
   [PropertyType.Int, 0x11, 0, 127, "EFXParameter5"],
   [PropertyType.Int, 0x12, 0, 127, "EFXParameter6"],
   [PropertyType.Int, 0x13, 0, 127, "EFXParameter7"],
   [PropertyType.Int, 0x14, 0, 127, "EFXParameter8"],
   [PropertyType.Int, 0x15, 0, 127, "EFXParameter9"],
   [PropertyType.Int, 0x16, 0, 127, "EFXParameter10"],
   [PropertyType.Int, 0x17, 0, 127, "EFXParameter11"],
   [PropertyType.Int, 0x18, 0, 127, "EFXParameter12"],
   [PropertyType.Int, 0x19, 0, 2, "EFXOutputAssign"],
   [PropertyType.Int, 0x1a, 0, 127, "EFXMixOutSendLevel"],
   [PropertyType.Int, 0x1b, 0, 127, "EFXChorusSendLevel"],
   [PropertyType.Int, 0x1c, 0, 127, "EFXReverbSendLevel"],
   [PropertyType.Int, 0x1d, 0, 10,  "EFXControlSource1"],
   [PropertyType.Int, 0x1e, 0, 127, "EFXControlDepth1"],
   [PropertyType.Int, 0x1f, 0, 10, "EFXControlSource2"],
   [PropertyType.Int, 0x20, 0, 127, "EFXControlDepth2"],
   [PropertyType.Int, 0x21, 0, 127, "ChorusLevel"],
   [PropertyType.Int, 0x22, 0, 127, "ChorusRate"],
   [PropertyType.Int, 0x23, 0, 127, "ChorusDepth"],
   [PropertyType.Int, 0x24, 0, 127, "ChorusPreDelay"],
   [PropertyType.Int, 0x25, 0, 127, "ChorusFeedback"],
   [PropertyType.Int, 0x26, 0, 2, "ChorusOutput"],
   [PropertyType.Int, 0x27, 0, 7, "ReverbType"],
   [PropertyType.Int, 0x28, 0, 127, "ReverbLevel"],
   [PropertyType.Int, 0x29, 0, 127, "ReverbTime"],
   [PropertyType.Int, 0x2a, 0, 17,  "ReverbHFDamp"],
   [PropertyType.Int, 0x2b, 0, 127, "DelayFeedback"],
   [PropertyType.LargeInt, 0x2c, 20, 250, "PatchTempo"],
   [PropertyType.Int, 0x2e, 0, 127, "PatchLevel"],
   [PropertyType.Int, 0x2f, 0, 127, "PatchPan"],
   [PropertyType.Int, 0x30, 0, 127, "AnalogFeel"],
   [PropertyType.Int, 0x31, 0, 12, "BendRangeUp"],
   [PropertyType.Int, 0x32, 0, 48, "BendRangeDown"],
   [PropertyType.Int, 0x33, 0, 1, "KeyAssignMode"],
   [PropertyType.Int, 0x34, 0, 1, "SoloLegato"],
   [PropertyType.Int, 0x35, 0, 1, "PortamentoSwitch"],
   [PropertyType.Int, 0x36, 0, 1, "PortamentoMode"],
   [PropertyType.Int, 0x37, 0, 1, "PortamentoType"],
   [PropertyType.Int, 0x38, 0, 1, "PortamentoStart"],
   [PropertyType.Int, 0x39, 0, 127, "PortamentoTime"],
   [PropertyType.Int, 0x3a, 0, 15, "PatchControlSource2"],
   [PropertyType.Int, 0x3b, 0, 15, "PatchControlSource3"],
   [PropertyType.Int, 0x3c, 0, 2, "EFXControlHoldPeak"],
   [PropertyType.Int, 0x3d, 0, 2, "Control1HoldPeak"],
   [PropertyType.Int, 0x3e, 0, 2, "Control2HoldPeak"],
   [PropertyType.Int, 0x3f, 0, 2, "Control3HoldPeak"],
   [PropertyType.Int, 0x40, 0, 1, "VelocityRangeSwitch"],
   [PropertyType.Int, 0x41, 0, 6, "OctaveShift"],
   [PropertyType.Int, 0x42, 0, 3, "StretchTuneDepth"],
   [PropertyType.Int, 0x43, 0, 1, "VoicePriority"],
   [PropertyType.Int, 0x44, 0, 9, "StructureType12"],
   [PropertyType.Int, 0x45, 0, 3, "Booster12"],
   [PropertyType.Int, 0x46, 0, 9, "StructureType34"],
   [PropertyType.Int, 0x47, 0, 3, "Booster34"],
   [PropertyType.Int, 0x48, 0, 1, "ClockSource"],
   [PropertyType.Int, 0x49, 0, 127, "PatchCategory"]];
patchCommonProperties.map(
   p => addProperty(PatchCommon.prototype, p));


////// PATCH TONE //////

var PatchTone = function(data) {
   SysexData.call(this, patchToneSize, data);
}
PatchTone.prototype = Object.create(SysexData.prototype);
PatchTone.prototype.constructor = PatchTone;

const patchToneSize = 0x81;
var patchToneProperties = [
   [PropertyType.Int, 0x00, 0, 1, "ToneSwitch"],
   [PropertyType.Int, 0x01, 0, 2, "WaveGroupType"],
   [PropertyType.Int, 0x02, 0, 127, "WaveGroupID"],
   [PropertyType.LargeInt, 0x03, 0, 254, "WaveNumber"],
   [PropertyType.Int, 0x05, 0, 3, "WaveGain"],
   [PropertyType.Int, 0x06, 0, 1, "FXMSwitch"],
   [PropertyType.Int, 0x07, 0, 3, "FXMColor"],
   [PropertyType.Int, 0x08, 0, 15, "FXMDepth"],
   [PropertyType.Int, 0x09, 0, 7, "ToneDelayMode"],
   [PropertyType.Int, 0x0a, 0, 127, "ToneDelayTime"],
   [PropertyType.Int, 0x0b, 0, 127, "VelocityCrossFade"],
   [PropertyType.Int, 0x0c, 0, 127, "VelocityRangeLower"],
   [PropertyType.Int, 0x0d, 0, 127, "VelocityRangeUpper"],
   [PropertyType.Int, 0x0e, 0, 127, "KeyboardRangeLower"],
   [PropertyType.Int, 0x0f, 0, 127, "KeyboardRangeUpper"],
   [PropertyType.Int, 0x10, 0, 1, "RedamperControlSwitch"],
   [PropertyType.Int, 0x11, 0, 1, "VolumeControlSwitch"],
   [PropertyType.Int, 0x12, 0, 1, "Hold1ControlSwitch"],
   [PropertyType.Int, 0x13, 0, 1, "PitchBendControlSwitch"],
   [PropertyType.Int, 0x14, 0, 2, "PanControlSwitch"],
   [PropertyType.Int, 0x15, 0, 18, "Controller1Destination1"],
   [PropertyType.Int, 0x16, 0, 126, "Controller1Depth1"],
   [PropertyType.Int, 0x17, 0, 18, "Controller1Destination2"],
   [PropertyType.Int, 0x18, 0, 126, "Controller1Depth2"],
   [PropertyType.Int, 0x19, 0, 18, "Controller1Destination3"],
   [PropertyType.Int, 0x1a, 0, 126, "Controller1Depth3"],
   [PropertyType.Int, 0x1b, 0, 18, "Controller1Destination4"],
   [PropertyType.Int, 0x1c, 0, 126, "Controller1Depth4"],
   [PropertyType.Int, 0x1d, 0, 18, "Controller2Destination1"],
   [PropertyType.Int, 0x1e, 0, 126, "Controller2Depth1"],
   [PropertyType.Int, 0x1f, 0, 18, "Controller2Destination2"],
   [PropertyType.Int, 0x20, 0, 126, "Controller2Depth2"],
   [PropertyType.Int, 0x21, 0, 18, "Controller2Destination3"],
   [PropertyType.Int, 0x22, 0, 126, "Controller2Depth3"],
   [PropertyType.Int, 0x23, 0, 18, "Controller2Destination4"],
   [PropertyType.Int, 0x24, 0, 126, "Controller2Depth4"],
   [PropertyType.Int, 0x25, 0, 18, "Controller3Destination1"],
   [PropertyType.Int, 0x26, 0, 126, "Controller3Depth1"],
   [PropertyType.Int, 0x27, 0, 18, "Controller3Destination2"],
   [PropertyType.Int, 0x28, 0, 126, "Controller3Depth2"],
   [PropertyType.Int, 0x29, 0, 18, "Controller3Destination3"],
   [PropertyType.Int, 0x2a, 0, 126, "Controller3Depth3"],
   [PropertyType.Int, 0x2b, 0, 18, "Controller3Destination4"],
   [PropertyType.Int, 0x2c, 0, 126, "Controller3Depth4"],
   [PropertyType.Int, 0x2d, 0, 7, "LFO1Waveform"],
   [PropertyType.Int, 0x2e, 0, 1, "LFO1KeySync"],
   [PropertyType.Int, 0x2f, 0, 127, "LFO1Rate"],
   [PropertyType.Int, 0x30, 0, 4, "LFO1Offset"],
   [PropertyType.Int, 0x31, 0, 127, "LFO1DelayTime"],
   [PropertyType.Int, 0x32, 0, 3, "LFO1FadeMode"],
   [PropertyType.Int, 0x33, 0, 127, "LFO1FadeTime"],
   [PropertyType.Int, 0x34, 0, 2, "LFO1ExternalSync"],
   [PropertyType.Int, 0x35, 0, 7, "LFO2Waveform"],
   [PropertyType.Int, 0x36, 0, 1, "LFO2KeySync"],
   [PropertyType.Int, 0x37, 0, 127, "LFO2Rate"],
   [PropertyType.Int, 0x38, 0, 4, "LFO2Offset"],
   [PropertyType.Int, 0x39, 0, 127, "LFO2DelayTime"],
   [PropertyType.Int, 0x3a, 0, 3, "LFO2FadeMode"],
   [PropertyType.Int, 0x3b, 0, 127, "LFO2FadeTime"],
   [PropertyType.Int, 0x3c, 0, 2, "LFO2ExternalSync"],
   [PropertyType.Int, 0x3d, 0, 96, "CoarseTune"],
   [PropertyType.Int, 0x3e, 0, 100, "FineTune"],
   [PropertyType.Int, 0x3f, 0, 30, "RandomPitchDepth"],
   [PropertyType.Int, 0x40, 0, 15, "PitchKeyfollow"],
   [PropertyType.Int, 0x41, 0, 24, "PitchEnvelopeDepth"],
   [PropertyType.Int, 0x42, 0, 125, "PitchEnvelopeVelocitySens"],
   [PropertyType.Int, 0x43, 0, 14, "PitchEnvelopeVelocityTime1"],
   [PropertyType.Int, 0x44, 0, 14, "PitchEnvelopeVelocityTime4"],
   [PropertyType.Int, 0x45, 0, 14, "PitchEnvelopeTimeKeyfollow"],
   [PropertyType.Int, 0x46, 0, 127, "PitchEnvelopeTime1"],
   [PropertyType.Int, 0x47, 0, 127, "PitchEnvelopeTime2"],
   [PropertyType.Int, 0x48, 0, 127, "PitchEnvelopeTime3"],
   [PropertyType.Int, 0x49, 0, 127, "PitchEnvelopeTime4"],
   [PropertyType.Int, 0x4a, 0, 126, "PitchEnvelopeLevel1"],
   [PropertyType.Int, 0x4b, 0, 126, "PitchEnvelopeLevel2"],
   [PropertyType.Int, 0x4c, 0, 126, "PitchEnvelopeLevel3"],
   [PropertyType.Int, 0x4d, 0, 126, "PitchEnvelopeLevel4"],
   [PropertyType.Int, 0x4e, 0, 126, "PitchLFO1Depth"],
   [PropertyType.Int, 0x4f, 0, 126, "PitchLFO2Depth"],
   [PropertyType.Int, 0x50, 0, 4, "FilterType"],
   [PropertyType.Int, 0x51, 0, 127, "CutoffFrequency"],
   [PropertyType.Int, 0x52, 0, 15, "CutoffKeyfollow"],
   [PropertyType.Int, 0x53, 0, 127, "Resonance"],
   [PropertyType.Int, 0x54, 0, 125, "ResonanceVelocitySens"],
   [PropertyType.Int, 0x55, 0, 126, "FilterEnvelopeDepth"],
   [PropertyType.Int, 0x56, 0, 6, "FilterEnvelopeVelocityCurve"],
   [PropertyType.Int, 0x57, 0, 125, "FilterEnvelopeVelocitySens"],
   [PropertyType.Int, 0x58, 0, 14, "FilterEnvelopeVelocityTime1"],
   [PropertyType.Int, 0x59, 0, 14, "FilterEnvelopeVelocityTime4"],
   [PropertyType.Int, 0x5a, 0, 14, "FilterEnvelopeTimeKeyfollow"],
   [PropertyType.Int, 0x5b, 0, 127, "FilterEnvelopeTime1"],
   [PropertyType.Int, 0x5c, 0, 127, "FilterEnvelopeTime2"],
   [PropertyType.Int, 0x5d, 0, 127, "FilterEnvelopeTime3"],
   [PropertyType.Int, 0x5e, 0, 127, "FilterEnvelopeTime4"],
   [PropertyType.Int, 0x5f, 0, 127, "FilterEnvelopeLevel1"],
   [PropertyType.Int, 0x60, 0, 127, "FilterEnvelopeLevel2"],
   [PropertyType.Int, 0x61, 0, 127, "FilterEnvelopeLevel3"],
   [PropertyType.Int, 0x62, 0, 127, "FilterEnvelopeLevel4"],
   [PropertyType.Int, 0x63, 0, 126, "FilterLFO1Depth"],
   [PropertyType.Int, 0x64, 0, 126, "FilterLFO2Depth"],
   [PropertyType.Int, 0x65, 0, 127, "ToneLevel"],
   [PropertyType.Int, 0x66, 0, 3, "BiasDirection"],
   [PropertyType.Int, 0x67, 0, 127, "BiasPosition"],
   [PropertyType.Int, 0x68, 0, 14, "BiasLevel"],
   [PropertyType.Int, 0x69, 0, 6, "LevelEnvelopeVelocityCurve"],
   [PropertyType.Int, 0x6a, 0, 125, "LevelEnvelopeVelocitySens"],
   [PropertyType.Int, 0x6b, 0, 14, "LevelEnvelopeVelocityTime1"],
   [PropertyType.Int, 0x6c, 0, 14, "LevelEnvelopeVelocityTime4"],
   [PropertyType.Int, 0x6d, 0, 14, "LevelEnvelopeTimeKeyfollow"],
   [PropertyType.Int, 0x6e, 0, 127, "LevelEnvelopeTime1"],
   [PropertyType.Int, 0x6f, 0, 127, "LevelEnvelopeTime2"],
   [PropertyType.Int, 0x70, 0, 127, "LevelEnvelopeTime3"],
   [PropertyType.Int, 0x71, 0, 127, "LevelEnvelopeTime4"],
   [PropertyType.Int, 0x72, 0, 127, "LevelEnvelopeLevel1"],
   [PropertyType.Int, 0x73, 0, 127, "LevelEnvelopeLevel2"],
   [PropertyType.Int, 0x74, 0, 127, "LevelEnvelopeLevel3"],
   [PropertyType.Int, 0x75, 0, 126, "LevelEnvelopeLFO1Depth"],
   [PropertyType.Int, 0x76, 0, 126, "LevelEnvelopeLFO2Depth"],
   [PropertyType.Int, 0x77, 0, 127, "TonePan"],
   [PropertyType.Int, 0x78, 0, 14, "PanKeyfollow"],
   [PropertyType.Int, 0x79, 0, 63, "RandomPanDepth"],
   [PropertyType.Int, 0x7a, 1, 127, "AlternatePanDepth"],
   [PropertyType.Int, 0x7b, 0, 126, "PanLFO1Depth"],
   [PropertyType.Int, 0x7c, 0, 126, "PanLFO2Depth"],
   [PropertyType.Int, 0x7d, 0, 3, "OutputAssign"],
   [PropertyType.Int, 0x7e, 0, 127, "MixEFXSendLevel"],
   [PropertyType.Int, 0x7f, 0, 127, "ChorusSendLevel"],
   [PropertyType.Int, 0x80 /* 7-bit: 0x100 */, 0, 127, "ReverbSendLevel"]];
patchToneProperties.map(
   p => addProperty(PatchTone.prototype, p));
