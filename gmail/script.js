
// == SIMPL =====================================================
// Add simpl style to html tag
var htmlEl = document.documentElement;
htmlEl.classList.add('simpl');

// Turn debug loggings on/off
var simplifyDebug = true;

// Add keyboard shortcut for toggling on/off custom style
function toggleSimpl(event) {
	// If Cmd+J was pressed, toggle simpl
	if (event.metaKey && event.which == 74) {
		htmlEl.classList.toggle('simpl');
		event.preventDefault();
	}
}
window.addEventListener('keydown', toggleSimpl, false);

/* Add simpl Toggle button
window.addEventListener('load', function() {
	var elem = document.createElement("div");
	elem.id = 'simplToggle';
	elem.addEventListener('click', toggleSimpl, false);
	document.body.insertBefore(elem, document.body.childNodes[0]);
}, false);
*/

// Initialize saved states
if (window.localStorage.simplifyPreviewPane == "true") {
	if (simplifyDebug) console.log('Loading with split view');
	htmlEl.classList.add('splitView');
}
if (window.localStorage.simplifyLightTheme == "true") {
	if (simplifyDebug) console.log('Loading with light theme');
	htmlEl.classList.add('lightTheme');	
} else if (window.localStorage.simplifyDarkTheme == "true") {
	if (simplifyDebug) console.log('Loading with dark theme: ' + window.localStorage.simplifyDarkTheme)
	htmlEl.classList.add('darkTheme');
}
if (window.localStorage.simplifyDensity == "low") {
	if (simplifyDebug) console.log('Loading with low density inbox');
	htmlEl.classList.add('lowDensityInbox');
} else if (window.localStorage.simplifyDensity == "high") {
	if (simplifyDebug) console.log('Loading with high density inbox');
	htmlEl.classList.add('highDensityInbox');
}

// Hide Search box by default
if (typeof window.localStorage.simplifyHideSearch === 'undefined') {
	// Only default to hiding search if the window is smaller than 1441px wide
	if (window.innerWidth < 1441) {
		window.localStorage.simplifyHideSearch = true;
	} else {
		window.localStorage.simplifyHideSearch = false;
	}
}
if (window.localStorage.simplifyHideSearch == "true") {
	if (simplifyDebug) console.log('Loading with search hidden');
	htmlEl.classList.add('hideSearch');
}

// Make space for add-ons pane if the add-ons pane was open last time
if (typeof window.localStorage.simplifyAddOnPane === 'undefined') {
	window.localStorage.simplifyAddOnPane = false;
}
if (window.localStorage.simplifyAddOnPane == "true") {
	if (simplifyDebug) console.log('Loading with add-ons pane');
	htmlEl.classList.add('addOnsPane');
}




// == URL HISTORY =====================================================

// Set up urlHashes to track and update for closing Search and leaving Settings
var closeSearchUrlHash = location.hash.substring(1, 7) == "search" || "label/" ? "#inbox" : location.hash;
var closeSettingsUrlHash = location.hash.substring(1, 9) == "settings" ? "#inbox" : location.hash;

window.onhashchange = function() {
	if (location.hash.substring(1, 7) != "search" && location.hash.substring(1, 6) != "label") {
		closeSearchUrlHash = location.hash;
	}
	if (location.hash.substring(1, 9) != "settings")  {
		closeSettingsUrlHash = location.hash;
		htmlEl.classList.remove('inSettings');
	}
	if (location.hash.substring(1, 9) == "settings")  {
		htmlEl.classList.add('inSettings');
	}

	// if we were supposed to check the theme later, do it now
	if (checkThemeLater) {
		detectTheme();
	}
}

// Show back button if page loaded on Settings
if (location.hash.substring(1, 9) == "settings") {
	htmlEl.classList.add('inSettings');
}




// == INIT FUNCTIONS =====================================================

// Global variable to track if we should ignore focus (temp fix)
var ignoreSearchFocus = false; 

// Setup search event listeners
var initSearchLoops = 0;
function initSearch() {
	// See if Search form has be added to the dom yet
	var headerBar = document.getElementById('gb');
	var searchForm = (headerBar) ? headerBar.getElementsByTagName('form')[0] : false;

	// Setup Search functions to show/hide Search at the 
	// right times if we have access to the search field
	if (searchForm) {
		// Add .gb_vd, Gmail's own class to minimize search
		searchForm.classList.toggle('gb_vd');
		
		// Add function to search button to toggle search open/closed
		var searchButton = document.getElementsByClassName('gb_Ue')[0];
		var searchIcon = searchButton.getElementsByTagName('svg')[0];
		searchIcon.addEventListener('click', function() {
			htmlEl.classList.toggle('hideSearch');
			searchForm.classList.toggle('gb_vd');
			window.localStorage.simplifyHideSearch = htmlEl.classList.contains('hideSearch') ? true : false;
			// toggleSearchFocus();
		}, false);

		// Add functionality to search close button to close search and go back
		var searchCloseButton = document.getElementsByClassName('gb_Xe')[0];
		var searchCloseIcon = searchCloseButton.getElementsByTagName('svg')[0];
		
		/* THIS IS JANKY -- clicking on the close search input 
		 * gives it focus which keeps it open b/c of the event listener
		 * to keep it open in case it gets focus via keyboard shortcut
		 */		
		searchCloseIcon.addEventListener('click', function(e) {
			ignoreSearchFocus = true;
			searchForm.getElementsByTagName('input')[0].blur();
			htmlEl.classList.toggle('hideSearch');
			searchForm.classList.add('gb_vd');
			searchForm.classList.remove('gb_oe');
			location.hash = closeSearchUrlHash;
			window.localStorage.simplifyHideSearch = true;
			setTimeout(function() { ignoreSearchFocus = false; }, 200);
			// toggleSearchFocus();
		}, false);

		// Unrelated to search but hide the pagination controls if there are fewer than 50 items
		// togglePagination();

		// TODO: If initial page loaded is a search, show search box
		// ...

	} else {
		initSearchLoops++;
		if (simplifyDebug) console.log('initSearch loop #' + initSearchLoops);
		
		// only try 20 times and then asume something is wrong
		if (initSearchLoops < 21) {
			// Call init function again if the gear button field wasn't loaded yet
			setTimeout(initSearch, 500);
		}
	}
}


/* BUG: This is opening search when it shouldn't */
// Detect if search is focused and needs to be expanded
var initSearchFocusLoops = 0;
function initSearchFocus() {
	// If the search field gets focus and hideSearch hasn't been applied, add it
	var searchInput = document.querySelectorAll('header input[name="q"]')[0];

	if (searchInput) {
		if (location.hash.substring(1, 7) == "search") {
			htmlEl.classList.remove('hideSearch');
		}
		searchInput.addEventListener('focus', function() { 
			if (!ignoreSearchFocus) {
				htmlEl.classList.remove('hideSearch');
			}
		}, false );
	} else {
		// If the search field can't be found, wait and try again
		initSearchFocusLoops++;
		if (simplifyDebug) console.log('initSearchFocus loop #' + initSearchFocusLoops); 

		// only try 20 times and then asume something is wrong
		if (initSearchFocusLoops < 21) {
			// Call init function again if the search input wasn't loaded yet
			setTimeout(initSearchFocus, 500);
		}
	}
}


// Setup settigs event listeners
var initSettingsLoops = 0;
function initSettings() {
	// See if settings gear has be added to the dom yet
	var backButton = document.querySelector('header#gb div[aria-label="Go back"] svg');
	if (!backButton) {
		// aria-label doesn't work with non-english interfaces but .gb_1b changes often
		backButton = document.querySelector('header#gb div.gb_1b svg');
	}

	if (backButton) {
		backButton.addEventListener('click', function() {		
			if (location.hash.substring(1, 9) == "settings") {
				location.hash = closeSettingsUrlHash;
				htmlEl.classList.remove('inSettings');
			}
		}, false);
	} else {
		initSettingsLoops++;
		if (simplifyDebug) console.log('initSettings loop #' + initSettingsLoops);

		// only try 20 times and then asume something is wrong
		if (detectThemeLoops < 21) {
			// Call init function again if the gear button field wasn't loaded yet
			setTimeout(initSettings, 500);
		}
	}
}




// Detect if a dark theme is being used and change styles accordingly
// TODO: detect when they change themes
var detectThemeLoops = 0;
var checkThemeLater = false;
function detectTheme() {
	var msgCheckbox = document.querySelectorAll('div[gh="tl"] .xY > .T-Jo')[0];
	var conversation = document.querySelectorAll('table[role="presentation"]');
	if (msgCheckbox) {
		var checkboxBg = window.getComputedStyle(msgCheckbox, null).getPropertyValue("background-image");
		if (checkboxBg.indexOf('black') > -1) {
			htmlEl.classList.add('lightTheme');
			htmlEl.classList.remove('darkTheme');
			window.localStorage.simplifyLightTheme = true;
			window.localStorage.simplifyDarkTheme = false;
		} else {
			htmlEl.classList.add('darkTheme');
			htmlEl.classList.remove('lightTheme');
			window.localStorage.simplifyDarkTheme = true;
			window.localStorage.simplifyLightTheme = false;
		}
		checkThemeLater = false;
	} else if (conversation.length == 0) {
		// if we're not looking at a conversation, maybe the threadlist just hasn't loaded yet
		detectThemeLoops++;
		if (simplifyDebug) console.log('detectTheme loop #' + detectThemeLoops);

		// only try 10 times and then asume you're in a thread
		if (detectThemeLoops < 11) {
			setTimeout(detectTheme, 500);		
		}
	} else {
		// We are looking at a conversation, check the theme when the view changes
		checkThemeLater = true;
	}
}


// Detect the interface density so we can adjust the line height on items
var detectDensityLoops = 0;
function detectDensity() {
	var navItem = document.querySelectorAll('div[role="navigation"] .TN')[0]
	if (navItem) {
		var navItemHeight = parseInt(window.getComputedStyle(navItem, null).getPropertyValue("height"));
		if (simplifyDebug) console.log('Detecting inbox density via nav item. Height is ' + navItemHeight + 'px');
		if (navItemHeight == 24) {
			if (simplifyDebug) console.log('Detected high density');
			htmlEl.classList.remove('lowDensityInbox');
			htmlEl.classList.add('highDensityInbox');
			window.localStorage.simplifyDensity = "high";
		} else {
			if (simplifyDebug) console.log('Detected low density');
			htmlEl.classList.add('lowDensityInbox');
			htmlEl.classList.remove('highDensityInbox');
			window.localStorage.simplifyDensity = "low";
		}
	} else {
		detectDensityLoops++;
		if (simplifyDebug) console.log('detectDensity loop #' + detectDensityLoops);

		// only try 10 times and then assume no split view
		if (detectDensityLoops < 11) {
			// Call init function again if nav item wasn't loaded yet
			setTimeout(detectDensity, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting interface density');
		}
	}
}


// Detect if preview panes are enabled and being used
var detectSplitViewLoops = 0;
function detectSplitView() {
	var splitViewMenuLoaded = document.querySelectorAll('div[selector="nosplit"]');
	if (splitViewMenuLoaded) {
		var splitViewActive = document.querySelectorAll('div[role="main"] div[selector="nosplit"]').length
		if (splitViewActive > 0) {
			if (simplifyDebug) console.log('Split view detected and active');
			htmlEl.classList.add('splitView');
			window.localStorage.simplifyPreviewPane = true;

			/* Add event listeners on split view menu to toggle splitView 
			// BUG: Not working
			document.querySelectorAll('div[selector="nosplit"] > div')[0].addEventListener('click', function() {
				console.log('No split clicked');
				htmlEl.classList.remove('splitView');
			}, false);
			document.querySelectorAll('div[selector="horizontal"] > div')[0].addEventListener('click', function() {
				htmlEl.classList.add('splitView');
			}, false);
			document.querySelectorAll('div[selector="vertical"] > div')[0].addEventListener('click', function() {
				htmlEl.classList.add('splitView');
			}, false);
			// on .asa (quick toggle) -- common class name, not going to work
			// ...
			*/
		} else {
			if (simplifyDebug) console.log('No split view');
			htmlEl.classList.remove('splitView');
			window.localStorage.simplifyPreviewPane = false;
		}
	} else {
		detectSplitViewLoops++;
		if (simplifyDebug) console.log('initSettings loop #' + detectSplitViewLoops);

		// only try 10 times and then assume no split view
		if (detectSplitViewLoops < 11) {
			// Call init function again if the gear button field wasn't loaded yet
			setTimeout(detectSplitView, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting split view');
		}
	}
}



// Detect Right Side Chat (why hasn't Gmail killed this already?)
function detectRightSideChat() {
	var rightSideChat = document.getElementsByClassName('aCl')[0]
	if (rightSideChat) {
		if (simplifyDebug) console.log('Right side chat found');
		htmlEl.classList.add('rhsChat');
	} else {
		if (simplifyDebug) console.log('No right side chat found');
		htmlEl.classList.remove('rhsChat');
	}
}


// Detect Add-ons Pane
var detectAddOnsPaneLoops = 0;
function detectAddOns() {
	var addOnsPane = document.getElementsByClassName('brC-brG')[0];
	if (addOnsPane) {
		var paneVisible = window.getComputedStyle( document.getElementsByClassName('bq9')[0], null).getPropertyValue('width');
		if (simplifyDebug) console.log('Add-on pane width loaded as ' + paneVisible);
		if (paneVisible == "auto") {
			if (simplifyDebug) console.log('No add-on pane detected on load');
			htmlEl.classList.remove('addOnsPane');
			window.localStorage.simplifyAddOnPane = false;
		} else {
			if (simplifyDebug) console.log('Add-on pane detected on load');
			htmlEl.classList.add('addOnsPane');
			window.localStorage.simplifyAddOnPane = true;
		}

		// Options for the observer (which mutations to observe)
		var observerConfig = { attributes: true, childList: false, subtree: false };

		// Callback function to execute when mutations are observed
		var observerCallback = function(mutationsList, observer) {
		    for (var mutation of mutationsList) {
		        if (mutation.type == 'attributes' && mutation.attributeName == 'style') {
		        	if (simplifyDebug) console.log('Add-on pane style set to: ' + mutation.target.attributes.style.value);
		        	if (mutation.target.attributes.style.value.indexOf("display: none") > -1) {
		        		htmlEl.classList.remove('addOnsPane');
		        		window.localStorage.simplifyAddOnPane = false;
		        	} else {
		        		htmlEl.classList.add('addOnsPane');
		        		window.localStorage.simplifyAddOnPane = true;
		        	}
		        }
		    }
		};

		// Create an observer instance linked to the callback function
		var observer = new MutationObserver(observerCallback);

		// Start observing the target node for configured mutations
		if (simplifyDebug) console.log('Adding mutation observer for Add-ons Pane');
		observer.observe(addOnsPane, observerConfig);

		// Later, you can stop observing
		// observer.disconnect();
	} else {
		detectAddOnsPaneLoops++;
		if (simplifyDebug) console.log('detectAddOns loop #' + detectAddOnsPaneLoops);

		// only try 10 times and then assume no add-on pane
		if (detectAddOnsPaneLoops < 11) {
			// Call init function again if the add-on pane wasn't loaded yet
			setTimeout(detectAddOns, 500);
		} else {
			if (simplifyDebug) console.log('Giving up on detecting add-ons pane');
		}
	}
}



// Initialize everything
function initEarly() {
	initSearch();
	initSearchFocus();
	initSettings();
}
window.addEventListener('DOMContentLoaded', initEarly, false);

function initLate() {
	detectTheme();
	detectDensity();
	detectSplitView();
	detectRightSideChat();
	detectAddOns();
}
window.addEventListener('load', initLate, false);




// == SCRAPS =====================================================

/* Focus search input – NOT WORKING
function toggleSearchFocus() {
	var searchInput = document.querySelectorAll('input[aria-label="Search mail"]')[0];

	// We are about to show Search if hideSearch is still on the html tag
	if (htmlEl.classList.contains('hideSearch')) {
		searchInput.blur();
	} else {
		searchInput.focus();
	}
}
*/


/* Toggle pagination controls to only show when you need them
 * BUG: doesn't catch when you switch between inbox tabs
function togglePagination() {
	// If in list view, and pagination conrols exist, and fewer 
	// than 50 items, hide controls 
	var paginationControl = document.querySelectorAll('.aeH .Dj .ts')[2];
	if (paginationControl) {
		if (paginationControl.innerText < 50) { 
			console.log('hide pagination'); 
		} else { 
			console.log('show pagination'); 
		}	
	} else {
		console.log('no pagination control');
	}
}
*/
