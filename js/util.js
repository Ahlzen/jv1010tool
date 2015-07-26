// Console

function message(text) {
	$('#console').append(text + '<br/>');
}
function clearConsole() {
	$('#console').html('Console window<br/>');
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
