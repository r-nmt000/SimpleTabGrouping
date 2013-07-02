var allTabs = [];
var groupList = [];
var topGroupName = "";
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
    this.parent = this.id
    this.stored = true;
}

tabData.prototype = {
    //release tabs in tabGroup
    release:function(parent){
	console.log("release was called");
	this.stored = false;
	//when release the tab in new window
	var foundSameTab = false;
	for(var i in allTabs){
	    //check all tabs in all window and compare them with clicked tab		    
	    if(groupList[parent].winId === allTabs[i].windowId){
		//do not compare id
		//because id changes when tab is reopened
		if(this.url === allTabs[i].url){
		    //find flag up
		    foundSameTab = true;
		    break;
		}
	    }
	}
	if(!foundSameTab){
	    //release tab
	    chrome.tabs.create({windowId: groupList[parent].winId, url: this.url});
	}
	//toggle stored and released
	localStorage.groupList = JSON.stringify(groupList);
    },
    //close tabs and store them in a group
    store:function(parent){
	console.log("store was called");
	this.stored = true;
	for(var i in allTabs){
	    if(groupList[parent].winId === allTabs[i].windowId){
		if(this.url === allTabs[i].url){
		    //close a tab
		    chrome.tabs.remove(allTabs[i].id);
		    break;
		}
	    }
	}
	localStorage.groupList = JSON.stringify(groupList);
    },
}

function tabGroup(name, winId, tabs) {
    this.groupname = name;
    this.myTabs = tabs;
    this.stored = true;
    this.winId = winId;
}
tabGroup.prototype = {
    //add a tab to tabGroup
    add:function(tabId){
	console.log("add was called");
	//put data on top of myTabs
	if(allTabs[tabId]){
	    if(allTabs[tabId].url){
		this.convertTitle(tabId);
/*
		//count how many multi characters are there
		var multiNum = 0;
		var singleNum = 0;
		var len = 0;
		for(var i in allTabs[tabId].title){
		    var c = allTabs[tabId].title[i];		    
		    if (c < 256 || (c >= 0xff61 && c <= 0xff9f)) {
			singleNum +=1;
		    }else{
			multiNum += 1;
		    }
		    if((multiNum*2 + singleNum) > 20){
			break;
		    }
		}
		//make title short if it's too long		    
		if((multiNum*2 + singleNum) > 20){
		    allTabs[tabId].title = allTabs[tabId].title.substring(0,(multiNum+singleNum)) + " ...";
		}
*/
		this.myTabs.push(allTabs[tabId]);
		localStorage.groupList = JSON.stringify(groupList);
	    }
	}
    },
    //release tabs in tabGroup
    release:function(){
	console.log("release was called");
	//when release tabs in new window
	if(toNewWindow){
	    var first = true;
	    for(var i in this.myTabs){
		if(this.myTabs[i] && this.myTabs[i].stored){
		    this.myTabs[i].stored = false;
		    if(first){
			var winID;
			chrome.windows.create({url:this.myTabs[i].url},function(win){
			    winID=win.id;
			});
			var winID2 = winID;
			//always register new window id
			//forget about old one
			this.winId = winID2;
			first = false;
		    }else{
			chrome.tabs.create({windowId: this.winId, url: this.myTabs[i].url});
		    }
		}
	    }	    
	//when release tabs in current window
	}else{
	    for(var i in this.myTabs){
		if(this.myTabs[i] && this.myTabs[i].stored){
		    this.myTabs[i].stored = false;
		    chrome.tabs.create({url: this.myTabs[i].url});
		}
	    }
	}
	//toggle stored and released
	this.stored = false;
	localStorage.groupList = JSON.stringify(groupList);
    },
    //close tabs and store them in a group
    store:function(){
	console.log("store was called");
	//if tabs are released in current window
	for(var i in this.myTabs){
	    //validate myTabs[i] and check if it is stored or not
	    if(this.myTabs[i] && (!this.myTabs[i].stored)){
		this.myTabs[i].stored = true;
		for(var j in allTabs){
		    //do not compare id
		    //because id changes when a tab is reopened
		    if(this.myTabs[i].url == allTabs[j].url){
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
    },
    //delete a tab in tabGroup
    deleteTab:function(index){
	console.log("deleteTab was called");
	this.myTabs.splice(index, 1);
	localStorage.groupList = JSON.stringify(groupList);
	
    },
    //make title shorter
    convertTitle:function(tabId){
	//count how many multi characters are there
	var multiNum = 0;
	var singleNum = 0;
	var len = 0;
	for(var i in allTabs[tabId].title){
	    var c = allTabs[tabId].title.charCodeAt(i);		    
	    if (c < 256 || (c >= 0xff61 && c <= 0xff9f)) {
		singleNum +=1;
	    }else{
		multiNum += 1;
	    }
	    if((multiNum*2 + singleNum) > 20){
		break;
	    }
	}
	//make title short if it's too long		    
	if((multiNum*2 + singleNum) > 20){
	    allTabs[tabId].title = allTabs[tabId].title.substring(0,(multiNum+singleNum)) + " ...";
	}
    },	
	
}
function init() {
    //start eventlisteners
    assignEventHandlers();
    //get all opened tabs in current window
    updateAllTabs();
    //load strage data from localStrage
    if(localStorage.groupList){
	var tempGroups = JSON.parse(localStorage.groupList);
	for(var i in tempGroups){
	    var tempTabs = [];
	    for(var j in tempGroups[i].myTabs){
		tempTabs.push(new tabData(tempGroups[i].myTabs[j]));
	    }
	    groupList.push(new tabGroup(tempGroups[i].groupname,tempGroups[i].winId,tempTabs));
	}
    }else{
	//do something
    }

}

//called when shortcut key is pressed
function closeTab(tab){
    if(groupList.length>0){
	groupList[0].add(tab.id);
    }
    allTabs.splice(tab.id,1);
    chrome.tabs.remove(tab.id);
}

//get all tabs in the current window
function updateAllTabs(){
    chrome.windows.getAll({populate : true},function(windows){
	console.log("called");
	//refresh allTabs
	allTabs = [];
	for(var i in windows){	    
	    console.log(windows[i]);
	    chrome.tabs.getAllInWindow(windows[i].id, function(currentTabs){
		console.log("getAllInWindow");
		for(var i in currentTabs){
		    console.log(currentTabs[i]);
		    //refresh allTabs array
		    allTabs[currentTabs[i].id] = new tabData(currentTabs[i]);
		}
	    });
	}
    });
}


//assign eventhandlers
function assignEventHandlers() {
    //call when a tab is closed.
    //if groupList is empty, nothing will happen.
    //if a tab is created in a window, add it to allTabs.
/*
    chrome.tabs.onCreated.addListener(function(tab) {
	allTabs[tab.id] = new tabData(tab);
    });
*/
    chrome.tabs.onUpdated.addListener(function(a,b,tab) {
	allTabs[tab.id] = new tabData(tab);
    });
    chrome.tabs.onRemoved.addListener(function(tabId) {
	allTabs.splice(tabId,1);
    });
    chrome.commands.onCommand.addListener(function(command) {
	if (command == "shortcut") {
	    // Get the currently selected tab
	    chrome.tabs.getSelected(null, function(tab) {		
		closeTab(tab);
	    });
	}else if(command =="popup"){
	    //show popup
	    console.log("show popup called");
	}
    });
}


//handle groupList
function makeNewGroup(){
    //make room at head for new group
    //make new group and put it at head
    chrome.windows.getCurrent(function(window){
	var temp = [];
	groupList.unshift( new tabGroup(topGroupName,window.id,temp));
    });
    //save change to localStorage
    localStorage.groupList = JSON.stringify(groupList);
}
function deleteGroup(index){
    groupList.splice(index,1);
    localStorage.groupList = JSON.stringify(groupList);
}
function rearrangeGroups(){
    localStorage.groupList = JSON.stringify(groupList);
}



init();
chrome.browserAction.setBadgeText({"text":"100"})


