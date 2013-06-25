var allTabs = [];
var groupList = [];
var topGroupName = "";
function tabData(a) {
    this.id = a.id;
    this.windowId = a.windowId;
    this.title = a.title;
    this.favIconURL = a.favIconUrl;
    this.URL = a.url;
    this.screenCap = null;
    this.pinned = a.pinned;
    this.popped = !1;
    this.isIncognitoTab = a.incognito;
    this.parent = this.id
}


function tabGroup(name, tabs) {
    this.groupname = name;
    this.myTabs = tabs;

}
tabGroup.prototype = {
    //add a tab to tabGroup
    add:function(tabId){
	console.log("add was called");
	//put data on top of myTabs
	if(allTabs[tabId]){
	    if(allTabs[tabId].URL){
		this.myTabs.push(allTabs[tabId]);
		localStorage.groupList = JSON.stringify(groupList);
	    }
	}
    },
    //release tabs in tabGroup
    release:function(){
	console.log("release was called");
	for(var i in this.myTabs){
	    if(this.myTabs[i]){
		chrome.tabs.create({url: this.myTabs[i].URL});
	    }
	}
    },
    //delete a tab in tabGroup
    deleteTab:function(index){
	console.log("deleteTab was called");
	this.myTabs.splice(index, 1);
	localStorage.groupList = JSON.stringify(groupList);
	
    }
}
function init() {
    //start eventlisteners
    assignEventHandlers();
    //get all opened tabs in current window
    getAllTabs();
    //load strage data from localStrage
    if(localStorage.groupList){
	var temp = JSON.parse(localStorage.groupList);
	for(var i in temp){
	    groupList.push(new tabGroup(temp[i].groupname,temp[i].myTabs));
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
function getAllTabs(){
    chrome.tabs.getAllInWindow(null, function(currentTabs){
	allTabs = [];
	currentTabs.forEach(function(tab){
	    //refresh allTabs array

            allTabs[tab.id] = new tabData(tab);
	});
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
	}
    });
}


//handle groupList
function makeNewGroup(){
    //make room at head for new group
    //make new group and put it at head
    var temp = [];
    groupList.unshift( new tabGroup(topGroupName,temp));
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


