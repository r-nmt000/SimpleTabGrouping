var allTabs = {};
var groupList = [];
var topGroupName = '';
var toNewWindow = false;

function tabData(a) {
    this.id = a.id;
    this.windowId = a.windowId;
    this.title = a.title;
    this.favIconUrl = a.favIconUrl;
    this.url = a.url;
    this.screenCap = null;
    this.pinned = a.pinned;
    this.popped = !1;
    this.incognito = a.incognito;
    this.parent = this.id;
    this.stored = true;
}

tabData.prototype = {
    //release tabs in tabGroup
    release: function(parent) {
        this.stored = false;
	try {
            if (toNewWindow) {
	        var winID;
	        chrome.windows.create({url: this.url}, function(win) {
	            winID = win.id;
                });
	        var winID2 = winID;
		//always register new window id
		//forget about old one
		groupList[parent].winId = winID2;
	    }
            else{
	        //release tab
	        chrome.tabs.create({windowId: groupList[parent].winId, url: this.url});
	        //toggle stored and released
	        localStorage.groupList = JSON.stringify(groupList);
            }
	} catch (e) {
	    console.error('tabData.release', e);
	}
    },
    //close tabs and store them in a group
    store: function(parent) {
	this.stored = true;
	try {
	    for (var i in allTabs) {
		if (groupList[parent].winId === allTabs[i].windowId) {
		    if (this.url === allTabs[i].url) {
			//close a tab
			chrome.tabs.remove(allTabs[i].id);
			break;
		    }
		}
	    }
	    localStorage.groupList = JSON.stringify(groupList);
	} catch (e) {
	    console.error('tabData.store', e);
	}
    }
};

function tabGroup(name, winId, tabs) {
    this.groupname = name;
    this.myTabs = tabs;
    this.stored = true;
    this.winId = winId;
}
tabGroup.prototype = {
    //add a tab to tabGroup
    add: function(tabId) {
	//put data on top of myTabs
	try {
	    if (allTabs[tabId].url) {
		this.convertTitle(tabId);
		this.myTabs.push(allTabs[tabId]);
		localStorage.groupList = JSON.stringify(groupList);
	    }
	} catch (e) {
	    console.error('tabGroup.add', e);
	}
    },
    //release tabs in tabGroup
    release: function() {
	try {
	    //when release tabs in new window
	    if (toNewWindow) {
		var first = true;
		for (var i = 0; i < this.myTabs.length; i++) {
		    if (this.myTabs[i] && this.myTabs[i].stored) {
			this.myTabs[i].stored = false;
			if (first) {
			    var winID;
			    chrome.windows.create({url: this.myTabs[i].url}, function(win) {
				winID = win.id;
			    });
			    var winID2 = winID;
			    //always register new window id
			    //forget about old one
			    this.winId = winID2;
			    first = false;
			} else {
			    chrome.tabs.create({windowId: this.winId, url: this.myTabs[i].url});
			}
		    }
		}
		//when release tabs in current window
	    } else {
		for (var i = 0; i < this.myTabs.length; i++) {
		    if (this.myTabs[i] && this.myTabs[i].stored) {
			this.myTabs[i].stored = false;
			chrome.tabs.create({url: this.myTabs[i].url});
		    }
		}
	    }
	    //toggle stored and released
	    this.stored = false;
	    localStorage.groupList = JSON.stringify(groupList);
	} catch (e) {
	    console.error('tabGroup.release', e);
	}
    },
    //close tabs and store them in a group
    store: function() {
	try {
	    //if tabs are released in current window
	    for (var i = 0; i < this.myTabs.length; i++) {
		//validate myTabs[i] and check if it is stored or not
		if (this.myTabs[i] && (!this.myTabs[i].stored)) {
		    this.myTabs[i].stored = true;
		    for (var j in allTabs) {
			//do not compare id
			//because id changes when a tab is reopened
			if (this.myTabs[i].url == allTabs[j].url) {
			    //close a tab
			    chrome.tabs.remove(allTabs[j].id);
			    break;
			}
		    }
		}
	    }
	    //toggle stored and released
	    this.stored = true;
	    localStorage.groupList = JSON.stringify(groupList);
	} catch (e) {
	    console.error('tabGroup.store', e);
	}
    },
    //delete a tab in tabGroup
    deleteTab: function(index) {
	try {
	this.myTabs.splice(index, 1);
	localStorage.groupList = JSON.stringify(groupList);
	} catch (e) {
	    console.error('tabGroup.deleteTab', e);
	}
    },
    //make title shorter
    convertTitle: function(tabId) {
	//count how many multi characters are there
	var multiNum = 0;
	var singleNum = 0;
	var len = 0;
	try {
	    for (var i in allTabs[tabId].title) {
		var c = allTabs[tabId].title.charCodeAt(i);
		if (c < 256 || (c >= 0xff61 && c <= 0xff9f)) {
		    singleNum += 1;
		} else {
		    multiNum += 1;
		}
		if ((multiNum * 2 + singleNum) > 20) {
		    break;
		}
	    }
	    //make title short if it's too long
	    if ((multiNum * 2 + singleNum) > 20) {
		allTabs[tabId].title = allTabs[tabId].title.substring(0, (multiNum + singleNum)) + ' ...';
	    }
	} catch (e) {
	    console.error('tabGroup.convertTitle', e);
	}
    }
};
function init() {
    //start eventlisteners
    assignEventHandlers();
    //get all opened tabs in all windows
    updateAllTabs();
    //load strage data from localStrage
    try {
	var tempGroups = JSON.parse(localStorage.groupList);
	for (var i = 0; i < tempGroups.length; i++) {
	    var tempTabs = [];
	    for (var j = 0; j < tempGroups[i].myTabs.length; j++) {
		tempTabs.push(new tabData(tempGroups[i].myTabs[j]));
	    }
	    groupList.push(new tabGroup(tempGroups[i].groupname, tempGroups[i].winId, tempTabs));
	}
    } catch (e) {
	console.error('init', e);
    }
}

//called when shortcut key is pressed
function closeTab(tab) {
    var found = false;
    if (groupList.length > 0) {
        for(var i = 0; i < groupList[0].myTabs.length; i++){
            if(tab.url === groupList[0].myTabs[i].url){
                found = true;
                break;
            }
        }
        if(found === false){
            groupList[0].add(tab.id);
        }
    }
//    allTabs.splice(tab.id, 1);
      chrome.tabs.remove(tab.id);
}

//get all tabs in the current window
function updateAllTabs() {
    try {
	chrome.windows.getAll({populate: true}, function(windows) {
	    //refresh allTabs
	    allTabs = {};
	    for (var i in windows) {
		chrome.tabs.getAllInWindow(windows[i].id, function(currentTabs) {
		    for (var i in currentTabs) {
			//refresh allTabs array
			allTabs[currentTabs[i].id] = new tabData(currentTabs[i]);
		    }
		});
	    }
	});
    } catch (e) {
	console.error('updateAllTabs', e);
    }
}


//assign eventhandlers
function assignEventHandlers() {
    //call when a tab is closed.
    //if groupList is empty, nothing will happen.
    //if a tab is created in a window, add it to allTabs.
    chrome.tabs.onUpdated.addListener(function(a, b, tab) {
	allTabs[tab.id] = new tabData(tab);
    });
    chrome.tabs.onRemoved.addListener(function(tabId) {
        for(var i in groupList){
            for(var j in groupList[i].myTabs){
                if(groupList[i].myTabs[j].url === allTabs[tabId].url){
                    groupList[i].myTabs[j].stored = true;
                    break;
                }
            }
        }
	delete allTabs[tabId];
    });
    chrome.commands.onCommand.addListener(function(command) {
	if (command == 'shortcut') {
	    // Get the currently selected tab
	    chrome.tabs.getSelected(null, function(tab) {
		closeTab(tab);
	    });
	}
    });
}

//handle groupList
function makeNewGroup() {
    //make room at head for new group
    //make new group and put it at head
    chrome.windows.getCurrent(function(window) {
	var temp = [];
	groupList.unshift(new tabGroup(topGroupName, window.id, temp));
    });
    //save change to localStorage
    localStorage.groupList = JSON.stringify(groupList);
}
function deleteGroup(index) {
    groupList.splice(index, 1);
    localStorage.groupList = JSON.stringify(groupList);
}
function rearrangeGroups(draggedIndex, droppedIndex, parentIndex, droppedParent, pattern) {
    try {
        var temp;
	switch (pattern) {
	case 0: //group - group
	    if (draggedIndex < droppedIndex) droppedIndex--;
	    temp = groupList.splice(draggedIndex, 1);
	    groupList.splice(droppedIndex, 0, temp[0]);
	    break;
	case 1: //tab - tab
	    if (draggedIndex < droppedIndex) droppedIndex--;
	    temp = groupList[parentIndex].myTabs.splice(draggedIndex, 1);
	    groupList[parentIndex].myTabs.splice(droppedIndex, 0, temp[0]);
	    break;
	case 2: //tab - group
	    temp = groupList[parentIndex].myTabs.splice(draggedIndex, 1);
	    groupList[droppedIndex].myTabs.push(temp[0]);
	    break;
	case 3: //tab - tab in different groups
	    temp = groupList[parentIndex].myTabs.splice(draggedIndex, 1);
	    groupList[droppedParent].myTabs.splice(droppedIndex, 0, temp[0]);
	    break;
	default: break;
	}
	localStorage.groupList = JSON.stringify(groupList);
    } catch (e) {
	console.error('rearrangeGroups', e);
    }
}


init();
chrome.browserAction.setBadgeText({'text': '100'});
