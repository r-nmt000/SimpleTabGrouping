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
//    this.group = null;
}


function tabGroup(name, tabs) {
    this.groupname = name;
    this.myTabs = tabs;

}
tabGroup.prototype = {
    add:function(tabId){
	console.log("add was called");
	//put data on top of myTabs
	if(allTabs[tabId]){
	    if(allTabs[tabId].URL){
		this.myTabs.push(allTabs[tabId]);
		
		//	var popup = chrome.extension.getViews({"type":"popup"});
		//	if(!($.isEmptyObject(popup))){
		//add deleted tab in top group
		//	    popup.addTab(allTabs[tabId].title);
		//	}
		//delete tag data from allTabs
		allTabs.splice(tabId,1);
		//save data to localStorage
		localStorage.groupList = JSON.stringify(groupList);
	    }
	}
    },
    release:function(){
	console.log("release was called");
	for(var i in this.myTabs){
	    if(this.myTabs[i]){
		chrome.tabs.create({url: this.myTabs[i].URL});
	    }
	}
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

function getAllTabs(){
    chrome.tabs.getAllInWindow(null, function(currentTabs){
	currentTabs.forEach(function(tab){
            allTabs[tab.id] = new tabData(tab);
	});
    });
}
function assignEventHandlers() {
    //call when a tab is closed.
    //if groupList is empty, nothing will happen.
    chrome.tabs.onRemoved.addListener(function(tabId) {if(groupList.length>0){groupList[0].add(tabId)}});
    //if a tab is created in a window, add it to allTabs.
    chrome.tabs.onCreated.addListener(function(tab) {allTabs[tab.id] = new tabData(tab)});
/*
    chrome.tabs.onUpdated.addListener(function(tab) {
	if(allTabs[tab.id]){
	    allTabs.splice(tab.id,1);
	}
	allTabs[tab.id] = new tabData(tab)
    });
    chrome.tabs.onAttached.addListener(function(tabId) {if(groupList){groupList[0].add(tabId)}});
    chrome.tabs.onDetached.addListener(function(tabId) {allTabs.splice(tabId, 1)});
*/
}

function makeNewGroup(){
    //make room at head for new group
    //make new group and put it at head
    var temp = [];
    groupList.unshift( new tabGroup(topGroupName,temp));
    //save change to localStorage
    localStorage.groupList = JSON.stringify(groupList);
}
init();
chrome.browserAction.setBadgeText({"text":"100"})


