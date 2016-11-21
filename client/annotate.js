var logger = new Logger('Client:annotate');

Logger.setLevel('Client:annotate', 'trace');
// Logger.setLevel('Client:annotate', 'debug');
// Logger.setLevel('Client:annotate', 'info');
// Logger.setLevel('Client:annotate', 'warn');

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

Template.annotateTask.helpers({
    sentences: function() {
        logger.debug("Getting sentences...");
        return Sentences.find({docID: Session.get("currentDoc")._id},
                                {sort: {psn: 1}});
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
        if (!hasSummary && !hasAnnotations) {
            alert("Please summarize and annotate the document! Remember: we would like at least one purpose keyword and one mechanism keyword.");
        } else if (!hasSummary && hasAnnotations) {
            alert("Please summarize the document!");
        } else if (hasSummary && !hasAnnotations) {
            alert("Please annotate the document! Remember: we would like at least one purpose keyword and one mechanism keyword.");
        } else {
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
            DocumentManager.markAnnotatedBy(doc,
                                          user);
            EventLogger.logFinishDocument(doc._id);
            Router.go("Finish");
        }
        // Router.go("Finish");
    }
})

Template.sentence.helpers({
    words: function() {
        logger.debug("Getting words...");
        return Words.find({sentenceID: this._id},
                            {sort: { sequence : 1 }});
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
    'mousedown .token': function(event) {
      if (Session.get("highlightState") != "none") {
          logger.debug("Begin highlight");
          Session.set("isHighlighting", true);
          var word = event.currentTarget;
          logger.trace(word.innerHTML);
          var wordID = trimFromString(word.id, "word-");
          markWord(wordID);
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
        markWord(wordID);
      }
    },

    'click .key-option': function(event) {
        var selection = event.currentTarget;
        // var keyType = selection.innerText;
        // console.log(selection);
        var word = selection.parentNode.previousElementSibling;
        // console.log(word);
        var wordID = trimFromString(word.id, "word-");
        var userID = Session.get("currentUser")._id;
        logger.trace(userID + " clicked on " + wordID);
        if (selection.classList.contains("purp")) {
            WordManager.markWord(wordID, userID, "Purpose");
        } else if (selection.classList.contains("mech")) {
            WordManager.markWord(wordID, userID, "Mechanism");
        } else {
            WordManager.markWord(wordID, userID, "Neither");
        }
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
