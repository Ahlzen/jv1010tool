'use strict';

// String formatting
// based on code from StackOverflow:
// http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format

if (!String.prototype.format) {
    String.prototype.format = function() {
        var str = this.toString();
        if (!arguments.length)
            return str;
        var args = typeof arguments[0],
            args = (("string" == args || "number" == args) ? arguments : arguments[0]);
        for (arg in args)
            str = str.replace(RegExp("\\{" + arg + "\\}", "gi"), args[arg]);
        return str;
    }
}


// Function for loading/setting preferences

var prefix = 'midiUtils';
var storage = null;
if (typeof(Storage) !== "undefined") {
	storage = localStorage;
}

function setPrefs(name, value) {
	var key = prefix + '.' + name;
	if (storage) {
		// Use local storage
		storage.setItem(key, value);
	} else {
		// Use a cookie
		setCookie(key, value, 100);
	}
}

function getPrefs(name) {
	var key = prefix + '.' + name;
	if (storage) {
		// Use local storage
		return storage.getItem(key);
	} else {
		// Use a cookie
		return getCookie(key);
	}
}


// Cookie manipulation (from w3schools)

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i=0; i<ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return null;
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
