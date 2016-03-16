var logger = new Logger('Client:searchInstructions');

Logger.setLevel('Client:searchInstructions', 'trace');
// Logger.setLevel('Client:searchInstructions', 'debug');
// Logger.setLevel('Client:searchInstructions', 'info');
// Logger.setLevel('Client:searchInstructions', 'warn');



Template.SearchInstructions.events({
    'click .search-instructions-next-1' : function() {
        $('.inst-superficial').show();
    },

    'click .search-instructions-next-2' : function() {
        $('.inst-practice').show();
    },

    'click .test' : function(e) {
        if(e.target.classList.contains("correct")) {
            alert("Correct! They both separate objects (chopped food, food) from a host object (knife, skewer) by causing the host object to pass through another object (clip, slider)");
            $('.search-instructions-next-finish').show();
            EventLogger.logAnalogyTest(1);
        } else {
            alert("Incorrect! While both are about food/drink, they do not solve analogous problems. The cup holder solves the problem of stability, while the Glide and Sliders products both separate objects (chopped food, food) from a host object (knife, skewer) by causing the host object to pass through another object (clip, slider)");
            $('.search-instructions-next-finish').show();
            EventLogger.logAnalogyTest(0);
        }
    },

    'click .search-instructions-next-finish' : function() {
        userID = Session.get("currentUser")._id;
        var doc = DocumentManager.sampleDocument(); 
        logger.trace("Sending user to search task with document " + JSON.stringify(doc));
        Router.go("Search", {userID: userID,
                                docID: doc._id});    
        // EventLogger.logBeginDocument(doc._id);
    },
    'keyup input#userName': function (evt) {
      if(evt.keyCode==13) {
        //console.log("enter released, clicking continue");
        $('#nextPage').click();
      }
    },
});