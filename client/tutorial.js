var logger = new Logger('Client:tutorial');

Logger.setLevel('Client:tutorial', 'trace');
// Logger.setLevel('Client:tutorial', 'debug');
// Logger.setLevel('Client:tutorial', 'info');
// Logger.setLevel('Client:tutorial', 'warn');

Template.tutorialSentence.helpers({
    sampleWords : function() {
        var sentence = "Suntime has advantages over each of these because it records the intensity of sun exposure with the time of day of that exposure, provides a permanent paper record and operates with no batteries or electronics."
        var words = sentence.split(" ");
        var wordObjects = [];
        for (i=0; i < words.length; i++) {
            var w = {_id: i, content: words[i]}
            wordObjects.push(w);
        }
        logger.trace("Tutorial words: " + JSON.stringify(wordObjects))
        return wordObjects;
    }
});

Template.tutorialSentence.events({
    'click .key-option': function(event) {
        var selection = event.currentTarget;
        // var keyType = selection.innerText;
        // console.log(selection);
        var word = selection.parentNode.previousElementSibling;
        // console.log(word);
        var wordID = "#" + word.id;
        var wordText = $(wordID).text().trim();
        userID = Session.get("currentUser")._id;
        logger.trace(userID + " clicked on " + wordText + " with id " + wordID);
        if (selection.classList.contains("purp")) {
            $(wordID).addClass('key-purpose');
            $(wordID).removeClass('key-mechanism');
            $(wordID).removeClass('key-neutral');
            EventLogger.logMarkTutorialWord(wordText, "Purpose");
        } else if (selection.classList.contains("mech")) {
            $(wordID).removeClass('key-purpose');
            $(wordID).addClass('key-mechanism');
            $(wordID).removeClass('key-neutral');
            EventLogger.logMarkTutorialWord(wordText, "Mechanism");
        } else {
            $(wordID).removeClass('key-purpose');
            $(wordID).removeClass('key-mechanism');
            $(wordID).addClass('key-neutral');
            EventLogger.logMarkTutorialWord(wordText, "Unmark");
        }
    }
});

Template.tutorial.events({
    'click .continue' : function() {
        logger.debug("User clicked continue");
        EventLogger.logFinishTutorial();
        var user = Session.get("currentUser");
        if (user) {
			//let filters = {user._id};
			Meteor.call( 'getSample', user._id, ( error, response ) => {
				if ( error ) {
					logger.debug("Failed server call:" + error.reason );
				} else {
					let doc = response;
					Session.set("currentDoc", doc);
					Router.go("Annotate", {userID: user._id, docID: doc._id});
					logger.debug("Doc:" + doc );
				}
			  });
			/*
            var doc = DocumentManager.sampleDocument(user._id); 
            logger.trace("Sending user to annotation task with document " + JSON.stringify(doc));
            Router.go("Annotate", {userID: user._id,
                                    docID: doc._id});    
			*/
        } else {
            logger.warn("User is not logged in");
            alert("You need to have entered your MTurkID to continue");
            Router.go("Land")
        }   
    }
});