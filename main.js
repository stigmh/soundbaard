var favorites = [];
var privacyAsked = false;

function storageAvailable(type) {
	var storage;
	try {
		storage = window[type];
		var x = '__storage_test__';
		storage.setItem(x, x);
		storage.removeItem(x);
		return true;
	} catch(e) {
		return e instanceof DOMException && (
		// everything except Firefox
		e.code === 22 ||
		// Firefox
		e.code === 1014 ||
		// test name field too, because code might not be present
		// everything except Firefox
		e.name === 'QuotaExceededError' ||
		// Firefox
		e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
		// acknowledge QuotaExceededError only if there's something already stored
		(storage && storage.length !== 0);
	}
}

var localStorageAvailable = storageAvailable('localStorage');

if (localStorageAvailable) {
	if (localStorage.getItem('favorites') !== null) {
		favorites = localStorage.getItem('favorites').split(',');
		privacyAsked = true;
	}
} else {
	privacyAsked = true;
}

function addClass(element, className) {
	var classes = element.className.split(' ');

	if (classes.indexOf(className) !== -1) {
		return;
	}

	classes.push(className);
	element.className = classes.join(' ');
}


function removeClass(element, className) {
	var classes = element.className.split(' ');
	var pos = classes.indexOf(className);

	if (pos === -1) {
		return;
	}

	classes.splice(pos, 1);
	element.className = classes.join(' ');
}


function isAudioPlaying(a) {
    return a
        && a.currentTime > 0
        && !a.paused
        && !a.ended
        && a.readyState > 2;
}

function buttonListener(event) {
	event.preventDefault();
	var target = event.target;
	var audioDOM = target.parentElement.parentElement.getElementsByTagName('audio')[0];
	var audioPlaying = isAudioPlaying(audioDOM);
	var looping = (audioDOM.getAttribute('loop') !== null);
	var playBtn;
	var loopBtn;
	
	if (target.getAttribute('class') === 'playBtn') {
		playBtn = target;
		loopBtn = target.parentElement.getElementsByClassName('loopBtn')[0];
		
		if (audioPlaying) {
			playBtn.innerHTML = '▶️';
			audioDOM.pause();
			audioDOM.currentTime = 0;

			if (looping) {
				audioDOM.removeAttribute('loop');
				loopBtn.innerHTML = '🔁';
			}

			removeClass(audioDOM.parentElement.parentElement, 'playing');
		} else {
			playBtn.innerHTML = '⏹️';
			audioDOM.play();
			addClass(audioDOM.parentElement.parentElement, 'playing');
		}
	} else if (target.getAttribute('class') === 'loopBtn') {
		playBtn = target.parentElement.getElementsByClassName('playBtn')[0];
		loopBtn = target;
		
		if (!audioPlaying && !looping) {
			playBtn.innerHTML = '⏹️';
			addClass(audioDOM.parentElement.parentElement, 'playing');
			audioDOM.play();
		}
		
		if (looping) {
			audioDOM.removeAttribute('loop');
			target.innerHTML = '🔁';
		} else {
			audioDOM.setAttribute('loop', 'true');
			target.innerHTML = '🔂';
		}
		
	} else {
		console.error('Unknown event generator');
		console.log(event);
	}
}


function endedListener(event) {
	var audioDOM = event.target;
	var looping = (audioDOM.getAttribute('loop') !== null);

	if (looping) {
		return;
	}

	var loopBtn = audioDOM.parentElement.getElementsByClassName('loopBtn')[0];
	var playBtn = audioDOM.parentElement.getElementsByClassName('playBtn')[0];

	removeClass(audioDOM.parentElement.parentElement, 'playing');
	playBtn.innerHTML = '▶️';
}


function filter(event) {
	event.preventDefault();

	var i;
	var input = event.target.value.toLowerCase();
	var elements = document.getElementsByClassName('object');
	var empty = (input.length === 0);

	removeClass(document.getElementById('favorite'), 'favoactive');

	for (i = 0; i < elements.length; ++i) {
		if (empty || elements[i].childNodes[0].childNodes[1].innerText.toLowerCase().indexOf(input) !== -1) {
			removeClass(elements[i], 'hidden');
		} else {
			addClass(elements[i], 'hidden');
		}
	}
}


function filterFavorites(event) {
	event.preventDefault();

	var i;
	document.getElementById('filter').value = '';
	var elements = document.getElementsByClassName('object');
	var enable = (event.target.className.indexOf('favoactive') === -1);

	if (enable) {
		addClass(event.target, 'favoactive');
	} else {
		removeClass(event.target, 'favoactive');
	}

	for (i = 0; i < elements.length; ++i) {
		var id = elements[i].getAttribute('id');

		if (!enable) {
			removeClass(elements[i], 'hidden');
			continue;
		}

		if (favorites.indexOf(id) === -1) {
			addClass(elements[i], 'hidden');
		} else {
			removeClass(elements[i], 'hidden');
		}
	}
}


function favoriteToggle(event) {
	event.preventDefault();
	var id = event.target.parentNode.parentNode.getAttribute('id');
	var idx = favorites.indexOf(id);

	if (idx === -1) {
		favorites.push(id);
		addClass(event.target, 'favoactive');
	} else {
		favorites.splice(idx, 1);
		removeClass(event.target, 'favoactive');

		if (document.getElementById('favorite').className.indexOf('favoactive') !== -1) {
			addClass(event.target.parentNode.parentNode, 'hidden');
		}
	}

	if (!privacyAsked) {
		privacyAsked = true;

		if (window.confirm('Favorites will be stored in the browser\'s "localStorage" field "favorites" for this domain. We do not store this information on the server or share it with anyone. Is it OK to proceed?')) {
			return localStorage.setItem('favorites', favorites.join(','));
		}
	} else if (localStorage.getItem('favorites') !== null) {
		localStorage.setItem('favorites', favorites.join(','));
	}
}

function renderList(list) {
	var i;
	var objectsDom = document.getElementById('objects');

	document.getElementById('filter').removeEventListener('keyup', filter);
	document.getElementById('favorite').removeEventListener('click', filterFavorites);

	while (objectsDom.firstChild) {
		objectsDom.removeChild(objectsDom.firstChild);
	}

	var audios = document.getElementsByTagName('audio');
	for (i = 0; i < audios.length; ++i) {
		audios[i].removeEventListener('ended', endedListener);
	}

	var buttons = document.getElementsByTagName('button');
	for (i = 0; i < buttons.length; ++i) {
		buttons[i].removeEventListener('click', buttonListener);
	}

	for (i = 0; i < list.length; ++i) {
		var container = document.createElement('div');
		var wrap = document.createElement('div');

		var title = document.createElement('div');
		var audio = document.createElement('audio');
		var favorite = document.createElement('div');
		var controls = document.createElement('div');

		var playBtn = document.createElement('button');
		var loopBtn = document.createElement('button');

		container.setAttribute('class', 'object');
		container.setAttribute('id', list[i].id);
		favorite.setAttribute('class', 'favofilter');
		wrap.setAttribute('class', 'wrap');
		playBtn.setAttribute('class', 'playBtn');
		loopBtn.setAttribute('class', 'loopBtn');
		audio.setAttribute('src', list[i].file);

		if (favorites.indexOf(list[i].id) !== -1) {
			addClass(favorite, 'favoactive');
		}

		title.innerHTML = list[i].title;
		playBtn.innerHTML = '▶️';
		loopBtn.innerHTML = '🔁';
		favorite.innerHTML = '⭐';

		audio.addEventListener('ended', endedListener);
		playBtn.addEventListener('click', buttonListener);
		loopBtn.addEventListener('click', buttonListener);
		favorite.addEventListener('click', favoriteToggle);

		controls.appendChild(playBtn);
		controls.appendChild(loopBtn);
		wrap.appendChild(audio);
		wrap.appendChild(title);
		wrap.appendChild(favorite);
		wrap.appendChild(controls);
		container.appendChild(wrap);

		objectsDom.appendChild(container);
	}

	document.getElementById('filter').addEventListener('keyup', filter);
	document.getElementById('favorite').addEventListener('click', filterFavorites);
}


function ready(callback){
	if (document.readyState != 'loading') {
		// in case the document is already rendered
		return callback();
	} else if (document.addEventListener) {
		// modern browsers
		document.addEventListener('DOMContentLoaded', callback);
	} else {
		// IE <= 8
		document.attachEvent('onreadystatechange', function() {
			if (document.readyState === 'complete') {
				callback();
			}
		});
	}
}


function main(json) {
	renderList(json);
	document.getElementById('filter').value = '';
}


ready(function() {
	main(sfx);
});
