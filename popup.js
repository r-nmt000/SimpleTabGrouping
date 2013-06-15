var bg = chrome.extension.getBackgroundPage();



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
        }
        else {
            h.itemParent.prepend(h.item);
        }
		//checks the classes on the lists
		$('#sitemap li.sm2_liOpen').not(':has(li)').removeClass('sm2_liOpen');
		$('#sitemap li:has(ul li):not(.sm2_liClosed)').addClass('sm2_liOpen');
    }
}
    

$(function(){

    //load groups from localStorage
    for(var i in bg.groupList ){
	var groupname = bg.groupList[i].groupname;
	$("#sitemap").append('<li class="sm2_liClosed"><div class="dropzone"></div><dl class="sm2_s_published"><a href="#"class="sm2_expander">&nbsp;</a><dt><a class="sm2_title" href="#">'+groupname+'</a></dt><dd class="sm2_actions"><strong>Actions:</strong><span class="sm2_delete" title="Delete">Delete</span></dd></dl></li>');
	if(bg.groupList[i].length != 0){
	    $("#sitemap li:last").append('<ul></ul>');
	    for(var j in bg.groupList[i].myTabs){
		var title;
		if(!bg.groupList[i].myTabs[j].title){
		    title = "";
		}else{
		    title = bg.groupList[i].myTabs[j].title;
		}
		$("#sitemap li:Last ul").append('<li class="child_tag"><dl class="sm2_s_published"><a href="#"class="sm2_expander">&nbsp;</a><!--<a href="#"class="sm2_release">&nbsp;</a>--><dt><a class="sm2_title" href="#">'+bg.groupList[i].myTabs[j].title+'</a></dt><dd class="sm2_actions"><strong>Actions:</strong> <span class="sm2_delete" title="Delete">Delete</span></dd></dl></li>');
	    }

	}
    }
    //load all tabs in a window to background's allTabs array.
    bg.getAllTabs();
    
/*
    $("#sitemap li").click(function(){
	//release tabs
	bg.groupList[0].release();
    });
*/
    $("#new:input").click(function(){	
	var groupname = $("#groupname").val();
	if(groupname){
	    //add new group at top
	    $("#sitemap").prepend('<li class="sm2_liClosed"><div class="dropzone"></div><dl class="sm2_s_published"><a href="#"class="sm2_expander">&nbsp;</a><dt><a class="sm2_title" href="#">'+groupname+'</a></dt><dd class="sm2_actions"><strong>Actions:</strong><span class="sm2_delete" title="Delete">Delete</span></dd></dl></li>');
	    $("#groupname").val("");
	    //reset draggable and droppable
	    $('#sitemap > li').draggable({
		handle: ' > dl',
		opacity: .8,
		addClasses: false,
		helper: 'clone',
		zIndex: 100,
		start: function(e, ui) {
		    sitemapHistory.saveState(this);
		}
	    });
	    $('#sitemap > li, #sitemap .dropzone').droppable({
		accept: '#sitemap li',
		tolerance: 'pointer',
		drop: function(e, ui) {
		    var li = $(this).parent();
		    var child = !$(this).hasClass('dropzone');
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
		    li.find('dl,.dropzone').css({ backgroundColor: '', borderColor: '' });
		    bg.topGroupName = $(".sm2_title:first").text();
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
	    bg.topGroupName = groupname;
	    bg.makeNewGroup();

	}
    });
    $(".delete").click(function(){
	$(this).parent().remove();
    });

    $('#groups').sortable( {
        revert: true,
	scroll: false,
	axis: 'y',
	update: function( event, ui ) {
	    var temp = "";
	    console.log("update was called");
	    bg.topGroupName = $("li:first").contents().not($("button")).text();
	    console.log($("li:first").contents().not($("button")).text());
	},
    } );

//    $("#groups-tree").jstree();
//    $("#jquery-ui-sortable").on("sortupdate", function( event, ui ) {} );
/*
    $('.ui-state-default').( {
        axis: 'y',
    } );
*/
//    $('#jquery-ui-draggable-connectToSortable').disableSelection();
    $('#sitemap li').prepend('<div class="dropzone"></div>');

    $('#sitemap > li, #sitemap .dropzone').droppable({
        accept: '#sitemap li',
        tolerance: 'pointer',
        drop: function(e, ui) {
            var li = $(this).parent();
            var child = !$(this).hasClass('dropzone');
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
            li.find('dl,.dropzone').css({ backgroundColor: '', borderColor: '' });
	    bg.topGroupName = $(".sm2_title:first").text();
	    
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
/*
    $('#sitemap').on('mousedown', 'li', function() {
	$(this).draggable({
	    handle: ' > dl',
            opacity: .8,
            addClasses: false,
            helper: 'clone',
            zIndex: 100,
            start: function(e, ui) {
		sitemapHistory.saveState(this);
            }
	});
    });
*/

    $('#sitemap > li').draggable({
        handle: ' > dl',
        opacity: .8,
        addClasses: false,
        helper: 'clone',
        zIndex: 100,
        start: function(e, ui) {
            sitemapHistory.saveState(this);
        }
    });

    $('.sitemap_undo').click(sitemapHistory.restoreState);
    $(document).bind('keypress', function(e) {
        if (e.ctrlKey && (e.which == 122 || e.which == 26))
            sitemapHistory.restoreState();
    });
    $('#sitemap').on('click', 'li > .sm2_s_published > .sm2_expander', function() {
	$(this).parent().parent().toggleClass('sm2_liOpen').toggleClass('sm2_liClosed');
	return false;
    });
/*
    $('.sm2_expander').click(function() {
	$(this).parent().parent().toggleClass('sm2_liOpen').toggleClass('sm2_liClosed');
	return false;
    });
*/
});


