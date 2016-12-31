var logger = new Logger('Client:annotate');

Logger.setLevel('Client:annotate', 'trace');
// Logger.setLevel('Client:annotate', 'debug');
// Logger.setLevel('Client:annotate', 'info');
// Logger.setLevel('Client:annotate', 'warn');

// var currentStart = {'s': 0, 'w': 0};
var currentStart = 0;
// var currentEnd = {'s': 0, 'w': 0};
var currentEnd = 0;

Template.annotationPage.rendered = function(){
    Session.set("highlightState", "none");
}

Template.annotationPage.helpers({
    isLoggedIn: function() {
        var user = Session.get("currentUser");
        if (user) {
            return true;
        } else {
            return false;
        }
    }
});

Template.annotateTask.onCreated( () => {
	let template = Template.instance();
	template.sentences  = new ReactiveVar();
	template.words  = new ReactiveVar();
	logger.debug("Getting sentences...");
	Meteor.call( 'getSentences', Session.get("currentDoc")._id, ( error, response ) => {
		if ( error ) {
			logger.debug("Failed server call for Sentences:" + error.reason );
		} else {
			template.sentences.set( response );
		}
	});
});

Template.annotateTask.helpers({
    sentences: function() {
		return Template.instance().sentences.get();
	}
});

Template.annotateTask.helpers({
    title: function() {
        logger.debug("Getting title...");
        return Session.get("currentDoc").title;
    }
});

Template.annotateTask.events({
    'click .init-highlight': function(event) {
      var button = event.currentTarget;
      $('.init-highlight').removeClass("btn-success");
      button.classList.add("btn-success");
      if (isInList("purpose", button.classList)) {
        Session.set("highlightState", "purpose");
      } else if (isInList("mechanism", button.classList)) {
        Session.set("highlightState", "mechanism");
      } else if (isInList("unmark", button.classList)) {
        Session.set("highlightState", "unmark");
      } else {
        Session.set("highlightState", "none");
      }
    },

    'click .another': function() {
        do {
            var doc = DocumentManager.sampleDocument();
        }
        while (doc._id === Session.get("currentDoc")._id);
        Session.set("currentDoc", doc);
    },
    'click .finished': function() {
        var combination = $('input:radio[name="combination"]:checked').val();
		if (combination === undefined) {
			var hasCombinationSelection = false;
		} else {
			var hasCombinationSelection = true;
		}
    	// grab and check summary data
        var sumPurpose = $('#summ-purp').val();
        var sumMechanism = $('#summ-mech').val();
        logger.trace("Purpose summary: " + sumPurpose);
        logger.trace("Mechanism summary: " + sumMechanism);
        if (sumPurpose === "" || sumMechanism === "") {
            var hasSummary = false;
        } else {
            var hasSummary = true;
        }

        // check if annotated
        if (DocumentManager.isAnnotatedBy(Session.get("currentDoc"), Session.get("currentUser"))) {
            var hasAnnotations = true;
        } else {
            var hasAnnotations = false;
        }

        // only continue if we have all the data!
		if (!hasCombinationSelection && !hasAnnotations) {
		    alert("Please make selection on combination product and annotate the document! Remember: we would like at least one purpose keyword and one mechanism keyword.");
		} else if (!hasCombinationSelection && hasAnnotations) {
		    alert("Please make selection on combination product!");
		} else if (hasCombinationSelection && !hasAnnotations) {
		    alert("Please annotate the document! Remember: we would like at least one purpose keyword and one mechanism keyword.");
		}
		/*
		else if (!hasSummary && !hasAnnotations) {
            alert("Please summarize and annotate the document! Remember: we would like at least one purpose keyword and one mechanism keyword.");
        } else if (!hasSummary && hasAnnotations) {
            alert("Please summarize the document!");
        } else if (hasSummary && !hasAnnotations) {
            alert("Please annotate the document! Remember: we would like at least one purpose keyword and one mechanism keyword.");
        } 
		*/
		else {
            // grab the summary data and push to finish
            var user = Session.get("currentUser");
            var doc = Session.get("currentDoc");
            DocumentManager.addSummary(doc,
                                        "Purpose",
                                        sumPurpose,
                                        user);
            DocumentManager.addSummary(doc,
                                        "Mechanism",
                                        sumMechanism,
                                        user);
            DocumentManager.addSummary(doc,
                                        "Combination",
                                        combination,
                                        user);
            DocumentManager.markAnnotatedBy(doc,
                                          user);
            EventLogger.logFinishDocument(doc._id);
            Router.go("Finish");
        }
        // Router.go("Finish");
    },

    'mouseup': function() {
      if (Session.equals("isHighlighting", true)) {
        Session.set("isHighlighting", false);
      }
    }
})


Template.sentence.onCreated( () => {
	let template = Template.instance();
	template.words  = new ReactiveVar();
	logger.debug("Getting sentences...");
	Meteor.call( 'getWords', Session.get("currentDoc")._id, ( error, response ) => {
		if ( error ) {
			logger.debug("Failed server call for Words:" + error.reason );
		} else {
			template.words.set( response );
			Session.set("words", response);
		}
	});
});

Template.sentence.helpers({
    words: function() {
		let result = new Array();
		if (Template.instance().words.get() === undefined) {
			logger.debug("Loading words...");
		} else {
			let key = this._id;
			logger.debug("Words for Sentence ID..."+key);
			//let allWords = Session.get("words");
			//if (allWords === undefined) {
			//	allWords = [];
			//}
			//Session.set("words", allWords.concat(Template.instance().words.get()));
			//Session.set("words", Template.instance().words.get());
			Template.instance().words.get().forEach(function(w) {
			  if (w.sentenceID == key) {
			    w.wordDep = new Deps.Dependency();
			    w.wordDep.depend();
				result.push(w);
			  }
			});
		}
		//return Template.instance().words.get();
		return result;
	}
});

Template.word.helpers({
    isPurpose: function() {
        var userID = Session.get("currentUser")._id;
        // logger.debug("Current user is " + userID);
        // logger.trace("Users who have higlighted this as a purpose keyword: " +
            // JSON.stringify(this.highlightsPurpose));
        if (isInList(userID, this.highlightsPurpose)) {
            // logger.debug("isPurpose is true");
            return true;
        } else {
            return false;
        }
    },
    isMech: function() {
        var userID = Session.get("currentUser")._id;
        // logger.debug("Current user is " + userID);
        // logger.trace("Users who have higlighted this as a mechanism keyword: " +
            // JSON.stringify(this.highlightsMechanism));
        if (isInList(userID, this.highlightsMechanism)) {
            // logger.debug("isMech is true");
            return true;
        } else {
            return false;
        }
    },
    isNeutral: function() {
        var userID = Session.get("currentUser")._id;
        if (!isInList(userID, this.highlightsPurpose) &&
            !isInList(userID, this.highlightsMechanism)) {
            // logger.debug("isNeutral is true");
            return true;
        } else {
            return false;
        }
    }
});

Template.word.events({
    'mousedown .token': function(event,t) {
      if (Session.get("highlightState") != "none") {
          logger.debug("Begin highlight");
          Session.set("isHighlighting", true);
          var word = event.currentTarget;
          logger.trace(word.innerHTML);
          var wordID = trimFromString(word.id, "word-");

		  currentStart = this.globalPsn;
          markOneWord(this);
		  t.data.itemId = $(event.target).data('id');
		  t.data.wordDep.changed();
      }
    },

    'mouseup .token': function(event) {
      logger.debug("End highlight");
      Session.set("isHighlighting", false);
    },

    'mouseover .token': function(event) {
      logger.debug("Hovering over token");
      if (Session.get("isHighlighting")) {
        var word = event.currentTarget;
        logger.trace(word.innerHTML);
        var wordID = trimFromString(word.id, "word-");
        // currentEnd.s = Sentences.findOne(Words.findOne(wordID).sentenceID).psn;
        // currentEnd.w = Words.findOne(wordID).sequence;
        //currentEnd = Words.findOne(wordID).globalPsn;
		currentEnd = WordManager.findOne(wordID).globalPsn;
        logger.trace("Current start: " + currentStart);
        logger.trace("Current end: " + currentEnd);

        var selectedWords = Words.find({docID: Session.get("currentDoc")._id,
                                        globalPsn: {$gte: currentStart,
                                                    $lte: currentEnd}
                                        }).fetch();
        logger.trace("Selected words: " + selectedWords);
        // mark all of these words
        selectedWords.forEach(function(w) {
          markOneWord(w);
        });

        // // get all sentences included in the highlight
        // var selectedSentences = Sentences.find({psn: {$gte: currentStart.s, $lte: currentEnd.s}}).fetch();
        // logger.trace("Selected sentences: " + JSON.stringify(selectedSentences));
        // for (i=0; i<selectedSentences.length; i++) {
        //   var thisSentence = selectedSentences[i];
        //   logger.trace("This sentence: " + JSON.stringify(thisSentence));
        //   var theseWords = Words.find({sentenceID: thisSentence._id}).fetch();
        //   logger.trace("These words: " + JSON.stringify(theseWords));
        //   // first sentence in range
        //   if (i==0) {
        //     theseWords.forEach(function(w) {
        //       if (w.sequence >= currentStart.w) {
        //         markWord(w._id);
        //       }
        //     });
        //     // last sentence in range
        //   } else if (i+1 == selectedSentences.length) {
        //     theseWords.forEach(function(w) {
        //       if (w.sequence <= currentEnd.w) {
        //         markWord(w._id);
        //       }
        //     });
        //     // everything else we just dump in as a highlight
        //   } else {
        //     theseWords.forEach(function(w) {
        //       markWord(w._id);
        //     });
        //   }
        // }

        // markWord(wordID);
      }
    },

    'click .key-option': function(event,t) {
        var selection = event.currentTarget;
        // var keyType = selection.innerText;
        // console.log(selection);
        var word = selection.parentNode.previousElementSibling;
        // console.log(word);
        var wordID = trimFromString(word.id, "word-");
        var userID = Session.get("currentUser")._id;
        logger.trace(userID + " clicked on " + wordID);
        if (selection.classList.contains("purp")) {
            WordManager.markOneWord(word, userID, "Purpose");
        } else if (selection.classList.contains("mech")) {
            WordManager.markOneWord(word, userID, "Mechanism");
        } else {
            WordManager.markOneWord(word, userID, "Neither");
        }
		t.data.itemId = $(event.target).data('id');
		t.data.wordDep.changed();
	}
})

markWord = function(wordID) {
  var userID = Session.get("currentUser")._id;
  logger.trace(userID + " clicked on " + wordID);
  var highlightType = Session.get("highlightState");
  if (highlightType === "purpose") {
      WordManager.markWord(wordID, userID, "Purpose");
  } else if (highlightType === "mechanism") {
      WordManager.markWord(wordID, userID, "Mechanism");
  } else {
      WordManager.markWord(wordID, userID, "Neither");
  }
}

markOneWord = function(word) {
  var userID = Session.get("currentUser")._id;
  logger.trace(userID + " clicked on " + word._id);
  var highlightType = Session.get("highlightState");
  if (highlightType === "purpose") {
      WordManager.markOneWord(word, userID, "Purpose");
  } else if (highlightType === "mechanism") {
      WordManager.markOneWord(word, userID, "Mechanism");
  } else {
      WordManager.markOneWord(word, userID, "Neither");
  }
}

unMarkWord = function(wordID) {
  WordManager.markWord(wordID, userID, "Neither");
}
