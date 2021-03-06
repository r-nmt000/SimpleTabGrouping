var droppedIndex, draggedIndex, parentIndex;
var bg = chrome.extension.getBackgroundPage();
var GROUP_GROUP = 0, TAB_TAB = 1, TAB_GROUP = 2, TAB_TAB_DIFFGROUP = 3;


var sitemapHistory = {
    stack: new Array(),
    temp: null,
    //takes an element and saves it's position in the sitemap.
    //note: doesn't commit the save until commit() is called!
    //this is because we might decide to cancel the move
    saveState: function(item) {
        sitemapHistory.temp = { item: $(item), itemParent: $(item).parent(), itemAfter: $(item).prev() };
    },
    commit: function() {
        if (sitemapHistory.temp != null) sitemapHistory.stack.push(sitemapHistory.temp);
    },
    //restores the state of the last moved item.
    restoreState: function() {
        var h = sitemapHistory.stack.pop();
        if (h == null) return;
        if (h.itemAfter.length > 0) {
            h.itemAfter.after(h.item);
        } else {
            h.itemParent.prepend(h.item);
        }
        //checks the classes on the lists
        $('#sitemap li.sm2_liOpen').not(':has(li)').removeClass('sm2_liOpen');
        $('#sitemap li:has(ul li):not(.sm2_liClosed)').addClass('sm2_liOpen');
    }
};

//validate drag and drop function
function addDragDrop() {
    //reset draggable and droppable
    $('#sitemap li').draggable({
        handle: ' > dl',
        opacity: .8,
        addClasses: false,
        helper: 'clone',
        zIndex: 100,
        start: function(e, ui) {
            sitemapHistory.saveState(this);
            if ($(this).hasClass('child_tag')) {
                parentIndex = $('#sitemap > li').index($(this).parent().parent());
                draggedIndex = $('#sitemap > li').eq(parentIndex).find('li').index($(this));
            } else {
                parentIndex = -1;
                draggedIndex = $('#sitemap > li').index($(this));
            }
        }
    });
    $('#sitemap > li > .dropzone').droppable({
        accept: '#sitemap > li',
        tolerance: 'pointer',
        drop: function(e, ui) {
            var li = $(this).parent();
            var child = !$(this).hasClass('dropzone');
            droppedIndex = $('#sitemap > li').index($(this).parent());
            if (child && li.children('ul').length == 0) {
                li.append('<ul/>');
            }
            if (child) {
                li.addClass('sm2_liOpen').removeClass('sm2_liClosed').children('ul').append(ui.draggable);
            }
            else {
                li.before(ui.draggable);
            }
            $('#sitemap li.sm2_liOpen').not(':has(li:not(.ui-draggable-dragging))').removeClass('sm2_liOpen');
            li.find('dl, .dropzone').css({ backgroundColor: '', borderColor: '' });
            bg.topGroupName = $('.sm2_title:first').text();
            //save arrangement
            bg.rearrangeGroups(draggedIndex, droppedIndex, parentIndex, -1, GROUP_GROUP);
            sitemapHistory.commit();
        },
        over: function() {
            $(this).filter('dl').css({ backgroundColor: '#ccc' });
            $(this).filter('.dropzone').css({ borderColor: '#aaa' });
        },
        out: function() {
            $(this).filter('dl').css({ backgroundColor: '' });
            $(this).filter('.dropzone').css({ borderColor: '' });
        }
    });
    $('#sitemap ul .dropzone').droppable({
        accept: '#sitemap ul > li',
        tolerance: 'pointer',
        drop: function(e, ui) {
            var li = $(this).parent();
            var child = !$(this).hasClass('dropzone');
            var droppedParent = $('#sitemap > li').index($(li).parent().parent());
            droppedIndex = $('#sitemap > li').eq(droppedParent).find('li').index($(this).parent());
            if (child && li.children('ul').length == 0) {
                li.append('<ul/>');
            }
            if (child) {
                li.addClass('sm2_liOpen').removeClass('sm2_liClosed').children('ul').append(ui.draggable);
            }
            else {
                li.before(ui.draggable);
            }
            $('#sitemap li.sm2_liOpen').not(':has(li:not(.ui-draggable-dragging))').removeClass('sm2_liOpen');
            li.find('dl, .dropzone').css({ backgroundColor: '', borderColor: '' });
            bg.topGroupName = $('.sm2_title:first').text();
            //save arrangement
            if (droppedParent === parentIndex) {
                bg.rearrangeGroups(draggedIndex, droppedIndex, parentIndex, -1, TAB_TAB);
            } else {
                bg.rearrangeGroups(draggedIndex, droppedIndex, parentIndex, droppedParent, TAB_TAB_DIFFGROUP);
            }
            sitemapHistory.commit();
        },
        over: function() {
            $(this).filter('dl').css({ backgroundColor: '#ccc' });
            $(this).filter('.dropzone').css({ borderColor: '#aaa' });
        },
        out: function() {
            $(this).filter('dl').css({ backgroundColor: '' });
            $(this).filter('.dropzone').css({ borderColor: '' });
        }
    });
    $('#sitemap > li > dl').droppable({
        accept: '#sitemap ul > li',
        tolerance: 'pointer',
        drop: function(e, ui) {
            var li = $(this).parent();
            var child = !$(this).hasClass('dropzone');
            droppedIndex = $('#sitemap > li').index($(this).parent());
            if (child && li.children('ul').length == 0) {
                li.append('<ul/>');
            }
            if (child) {
                li.addClass('sm2_liOpen').removeClass('sm2_liClosed').children('ul').append(ui.draggable);
            }
            else {
                li.before(ui.draggable);
            }
            $('#sitemap li.sm2_liOpen').not(':has(li:not(.ui-draggable-dragging))').removeClass('sm2_liOpen');
            li.find('dl, .dropzone').css({ backgroundColor: '', borderColor: '' });
            bg.topGroupName = $('.sm2_title:first').text();
            //save arrangement
            bg.rearrangeGroups(draggedIndex, droppedIndex, parentIndex, -1, TAB_GROUP);
            sitemapHistory.commit();
        },
        over: function() {
            $(this).filter('dl').css({ backgroundColor: '#ccc' });
            $(this).filter('.dropzone').css({ borderColor: '#aaa' });
        },
        out: function() {
            $(this).filter('dl').css({ backgroundColor: '' });
            $(this).filter('.dropzone').css({ borderColor: '' });
        }
    });
}
function addTab(title) {
    $('#sitemap > li:first ul').append('<li class="child_tag col-xs-12 group"><dl class="sm2_s_published"><div class="row"><a href="#"class="sm2_expander col-xs-1">&nbsp;</a><!--<a href="#"class="sm2_release col-xs-1">&nbsp;</a>--><dt class="col-xs-9"><a class="sm2_title list-group-item" href="#">' + title + '</a></dt><dd class="sm2_actions col-xs-1"><strong>Actions:</strong> <span class="sm2_delete" title="Delete">Delete</span></dd></div></dl></li>');
}
function addGroup() {
    var groupname = $('#groupname').val();
    if (groupname) {
        //add new group at top
        $('#sitemap').prepend('<li class="sm2_liClosed col-xs-12 group"><div class="dropzone"></div><dl class="sm2_s_published"><div class="row"><a href="#"class="sm2_expander col-xs-1">&nbsp;</a><a href="#"class="stored col-xs-1">&nbsp;</a><dt class="col-xs-9"><a class="sm2_title list-group-item" href="#">' + groupname + '</a></dt><dd class="sm2_actions col-xs-1"><strong>Actions:</strong><span class="sm2_delete" title="Delete">Delete</span></dd></div></dl></li>');
        $('#groupname').val('');
        addDragDrop();
        bg.topGroupName = groupname;
        bg.makeNewGroup();
    }
}

//set saved groups in HTML
function setGroups() {
    //load groups from localStorage
    for (var i = 0; i < bg.groupList.length; i++) {
        var groupname = bg.groupList[i].groupname;
        if (bg.groupList[i].stored) {
            $('#sitemap').append('<li class="sm2_liClosed col-xs-12 group"><dl class="sm2_s_published"><div class="row"><a href="#"class="sm2_expander col-xs-1">&nbsp;</a><a href="#"class="stored col-xs-1">&nbsp;</a><dt class="col-xs-9"><a class="sm2_title list-group-item" href="#">' + groupname + '</a></dt><dd class="sm2_actions col-xs-1"><strong>Actions:</strong><span class="sm2_delete" title="Delete">Delete</span></dd></div></dl></li>');
        } else {
            $('#sitemap').append('<li class="sm2_liClosed col-xs-12 group"><dl class="sm2_s_published"><div class="row"><a href="#"class="sm2_expander col-xs-1">&nbsp;</a><a href="#"class="released col-xs-1">&nbsp;</a><dt class="col-xs-9"><a class="sm2_title list-group-item" href="#">' + groupname + '</a></dt><dd class="sm2_actions col-xs-1"><strong>Actions:</strong><span class="sm2_delete" title="Delete">Delete</span></dd></div></dl></li>');
        }
        if (bg.groupList[i].length != 0) {
            $('#sitemap > li:last').append('<ul class="list-group"></ul>');
            for (var j = 0; j < bg.groupList[i].myTabs.length; j++) {
                if (bg.groupList[i].myTabs[j]) {
                    if (bg.groupList[i].myTabs[j].stored) {
                        $('#sitemap > li:Last ul').append('<li class="child_tag col-xs-12"><dl class="sm2_s_published"><div class="row"><p class="col-xs-1"></p><a href="#"class="stored col-xs-1">&nbsp;</a><dt class="col-xs-8"><a class="sm2_title list-group-item" href="#">' + bg.groupList[i].myTabs[j].title + '</a></dt><dd class="sm2_actions col-xs-1"><strong>Actions:</strong> <span class="sm2_delete" title="Delete">Delete</span></dd></div></dl></li>');
                    } else {
                        $('#sitemap > li:Last ul').append('<li class="child_tag col-xs-12"><dl class="sm2_s_published"><div class="row"><p class="col-xs-1"></p><a href="#"class="released col-xs-1">&nbsp;</a><dt class="col-xs-8"><a class="sm2_title list-group-item" href="#">' + bg.groupList[i].myTabs[j].title + '</a></dt><dd class="sm2_actions col-xs-1"><strong>Actions:</strong> <span class="sm2_delete" title="Delete">Delete</span></dd></div></dl></li>');
                    }
                }
            }

        }
    }
}
$(function() {
    //load all tabs in a window to background's allTabs.
    bg.updateAllTabs();
    //set saved groups in HTML
    setGroups();

    //validate events
    $('#new:input').click(function() {addGroup()});
    $('#groupname').keypress(function(event) {if (event.which === 13) {addGroup()}});
    $('#groups').sortable({
        revert: true,
        scroll: false,
        axis: 'y',
        update: function(event, ui ) {
            var temp = '';
            bg.topGroupName = $('li:first').contents().not($('button')).text();
        }
    });
    $('#sitemap li').prepend('<div class="dropzone"></div>');

    /////////////////////////
    //validate drag and drop function
    ////////////////////////
    addDragDrop();

    $('.sitemap_undo').click(sitemapHistory.restoreState);
    $(document).bind('keypress', function(e) {
        if (e.ctrlKey && (e.which == 122 || e.which == 26))
            sitemapHistory.restoreState();
    });
    // $('#sitemap').on('click', 'li > .sm2_s_published > .sm2_expander', function() {
    $('#sitemap').on('click', '.sm2_expander', function() {
        console.log("clicked");
        $(this).parents('.group').toggleClass('sm2_liOpen sm2_liClosed');
        return false;
    });

    //when a delete button is clicked
    $('#sitemap').on('click', '.sm2_delete', function() {
        //tab or group
        var isTab = $(this).parents('.child_tag');
        //if it is a group
        if ((Object.keys(isTab).length === 3)) {
            //delete selected group from groupList
            var index = $('#sitemap > li').index($(this).parents('.group'));
            bg.deleteGroup(index);
            $(this).parents('.group').remove();
            //if it is a tab
        } else {
            var groupIndex = $('#sitemap > li').index($(this).parents('.group'));
            var tabIndex = $('#sitemap > li').eq(groupIndex).find('li').index($(this).parents('.child_tag'));
            bg.groupList[groupIndex].deleteTab(tabIndex);
            $(this).parents('.child_tag').remove();
        }
    });

    //when a group name is clicked, release all tabs in the group
    $('#sitemap').on('click', 'dt', function(event) {
        var isTab = $(this).parents('.child_tag');
        //if it is a group
        if (Object.keys(isTab).length === 3) {
            //check released or stored group
            var isStored = $(this).prev('.stored');
            var index = $('#sitemap > li').index($(this).parents('.group'));
            var selectedGroup = bg.groupList[index];
            //a group is stored
            if (!(Object.keys(isStored).length === 3)) {
                //select where tabs release
                if (event.metaKey) {
                    bg.toNewWindow = true;
                }
                else {
                    bg.toNewWindow = false;
                }
                //release a group
                selectedGroup.release();
                //toggle children's released and stored
                $(this).parents('.sm2_s_published').siblings('.list-group').find('.stored').toggleClass('stored released');
                //a group is released
            } else {
                //close tabs in the group
                selectedGroup.store();
                //chrome.tabs.onRemoved.addListener() doesn't work well
                //so refresh allTabs manually
                bg.updateAllTabs();
                //toggle children's released and stored
                $(this).parents('.sm2_s_published').siblings('.list-group').find('.released').toggleClass('stored released');
            }
            //switch released and stored
            $(this).siblings('a.released, .stored').toggleClass('stored released');
        //if it is a tab
        } else {
            //check released or stored tab
            var isStored = $(this).prev('.stored');
            var groupIndex = $('#sitemap > li').index($(this).parents('.group'));
            var tabIndex = $('#sitemap > li').eq(groupIndex).find('li').index($(this).parents('.child_tag'));
            var selectedTab = bg.groupList[groupIndex].myTabs[tabIndex];
            if (event.metaKey) {
                bg.toNewWindow = true;
            }
            else {
                bg.toNewWindow = false;
            }
            //stored
            if (!(Object.keys(isStored).length === 3)) {
                selectedTab.release(groupIndex);
            //released
            } else {
                selectedTab.store(groupIndex);
            }
            //toggle released and stored
            $(this).prev('a').toggleClass('stored released');
        }
    });

});
