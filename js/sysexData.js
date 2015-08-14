var SysexData = function(data) {
   this.data = data;
}

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
      case PropertyType.SplitInt:
         addSplitIntAccessor(obj, data[1], data[2], data[3], data[4]);
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

function addSplitIntAccessor(obj, offset, min, max, name) {
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



var PatchCommon = function(data = null) {
   if (data) {
      // TODO: Check size
      data = Uint8Array.from(data);
   } else {
      data = new Uint8Array(0x4a); // Patch common data is 0x4A bytes
   }
   SysexData.call(this, data);
}
PatchCommon.prototype = Object.create(SysexData.prototype);
PatchCommon.prototype.constructor = PatchCommon;

// Add "friendly" getters and setters for the raw data:

patchCommonProperties = [
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
   [PropertyType.SplitInt, 0x2c, 20, 250, "PatchTempo"],
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
