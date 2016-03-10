var logger = new Logger('Client:search');

Logger.setLevel('Client:search', 'trace');
// Logger.setLevel('Client:search', 'debug');
// Logger.setLevel('Client:search', 'info');
// Logger.setLevel('Client:search', 'warn');

var resultLength = 0;
var options = {
    keepHistory: 1000 * 60 * 5,
    localSearch: true
};
var fields = ['content'];
DocSearch = new SearchSource('documents', fields, options);

Template.SeedDocument.helpers({
    sentences: function() {
        logger.debug("Getting sentences...");
        return Sentences.find({docID: Session.get("currentDoc")._id},
                                {sort: {psn: 1}});
    }
});

Template.SeedDocument.events({
    'click .change-seed': function() {
        var confirmMsg = "Are you sure? You will clear all you work so far and move to a new document."
        // var selections = getSelections().fetch();
        var currentDoc = Session.get("currentDoc");
        if (confirm(confirmMsg)) {
            // TODO: log snapshot of current working space
            // Clear best match
            getBest().forEach(function(bMatch) {
                MatchManager.notMatch(currentDoc, bMatch)
            })
            // Clear possible matches
            getPossible().forEach(function(pMatch) {
                MatchManager.notMatch(currentDoc, pMatch)
            })
            // Clear query
            $('.search-remove-btn').click();
            // Get a new doc
            var newDoc = DocumentManager.sampleDocument()
            logger.trace("Sampled new document: " + JSON.stringify(newDoc));
            EventLogger.logNewSeed(currentDoc, newDoc);
            Session.set("currentDoc", newDoc);
            //
        }
        // var currentDoc = Session.get("currentDoc");
        // if (selections.length > 0) {
            // alert("Please remove all selected matches first if you want to choose another document to work on");
        // } else {
            // 
        // }
    },
});

Template.SearchBar.events({
    'click .search-apply-btn' : function(){
        var query = $('#search-query').val(); // grab query from text form
        Session.set("searchQuery",query);
        DocSearch.search(query);
        $('.search-apply-btn').addClass('btn-success');
        // logger.trace("Created new query: " + Session.get("searchQuery"));
    },

    'keyup input' : function(e, target){
        // logger.debug(e);
        // logger.debug(target);
        if(e.keyCode===13) {
          var btn = $('.search-apply-btn')
          btn.click();
        }
    },

    // clear full-text search of idea content
    'click .search-remove-btn' : function(){
        var lastQuery = Session.get("searchQuery");
        Session.set("searchQuery","############################");
        DocSearch.search("############################");
        $('.search-apply-btn').removeClass('btn-success');
        $('#search-query').val("");
        $('.doc-match').unhighlight();
        var matchData = Session.get("lastMatchSet");
        logger.trace("Last match set: " + JSON.stringify(matchData));
        var allMatches = matchData.matches;
        var ranks = matchData.ranks;
        allMatches.forEach(function(m) {
            if (!(isPossibleMatch(m) || isBestMatch(m))) {
                var thisRank = ranks[m._id];
                EventLogger.logRejectMatch(lastQuery, m, thisRank);
            }
        });
    },
})

Template.SearchResults.rendered = function () {
    DocSearch.search("############################");
    Session.set("matchingDocs", []);
};

Template.SearchResults.helpers({
    matchingDocs: function() {
        var query = Session.get("searchQuery");
        var queryMatchData = getMatches();
        // logger.trace(JSON.stringify(queryMatches));
        Session.set("lastMatchSet", queryMatchData);
        EventLogger.logNewSearch(query)
        return queryMatchData.matches;
    },
    hasMatches: function() {
        var resultLength = getMatches().matches.length;
        // resultLength = DocSearch.getData({
        //       transform: function(matchText, regExp) {
        //         return matchText.replace(regExp, "<b>$&</b>")
        //       },
        //       sort: {isoScore: -1}
        //     }).length;
        if (resultLength < 1) {
            return false;
        } else {
            return true;
        }
    },
    numMatches: function() {
        return getMatches().matches.length;
        // return DocSearch.getData({
        //       transform: function(matchText, regExp) {
        //         return matchText.replace(regExp, "<b>$&</b>")
        //       },
        //       sort: {isoScore: -1}
        //     }).length;
    }
});

Template.Selections.helpers({
    bestMatches: function() {
        return getBest();
    },
    possibleMatches: function() {
        return getPossible();
        // var user = Session.get("currentUser");
        // var docMatches = DocMatches.find({userID: user._id, seedDocID: Session.get("currentDoc")._id}).fetch();
        // var matchingDocs = []
        // docMatches.forEach(function(m) {
        //     matchingDocs.push(m.matchDocID);
        // });
        // return Documents.find({_id: {$in: matchingDocs}});
    },
    numPossible: function() {
        return getPossible().count();
    },
});

Template.Selections.events({
    'click .submit-match': function() {
        // grab and check summary data
        var bestMatches = getBest().fetch();
        if (bestMatches.length < 1) {
            alert("You must select one best match; if you don't think there are any good matches, click \"change document\" to get another target document");
        // } else if (selections.length > 1) {
        //     alert("You must select only one best match");
        } else {
            var user = Session.get("currentUser");
            var doc = Session.get("currentDoc");
            var summary = $("#matchDescription").val();
            EventLogger.logMatchSubmission(selections[0], summary);
            DocumentManager.markAnnotatedBy(doc, user);
            EventLogger.logFinishDocument(doc._id);
            Router.go("Finish");        
        }
    }
});

Template.Document.rendered = function() {
    $('.doc-match').unhighlight();
    var query = Session.get("searchQuery");
    $('.doc-match').highlight(query.split(" "));
};

Template.Document.helpers({
    sentences: function() {
        return Sentences.find({docID: this._id}, {sort: {psn: 1}});
    },
    isPossibleMatch: function() {
        return isPossibleMatch(this);
    },
    isBestMatch: function() {
        return isBestMatch(this);
    }
});

Template.Document.events({
    'click .match-add': function() {
        logger.debug("Clicked match button");
        var thisDoc = this;
        MatchManager.possibleMatch(Session.get("currentDoc"), thisDoc);
        var matchData = Session.get("lastMatchSet");
        logger.trace("Last match set: " + JSON.stringify(matchData));
        var allMatches = matchData.matches;
        var ranks = matchData.ranks;
        var thisRank = ranks[thisDoc._id];
        var query = Session.get("searchQuery");
        EventLogger.logSelectMatch(query, thisDoc, thisRank);
        allMatches.forEach(function(m) {
            if (!m._id != thisDoc._id) {
                thisRank = ranks[m._id];
                EventLogger.logRejectMatch(query, m, thisRank);
            }
        });
    },
    'click .match-remove': function() {
        logger.debug("Clicked match remove button");
        logger.trace(this);
        MatchManager.notMatch(Session.get("currentDoc"), this);
        EventLogger.logRejectPreviousSelection(this);
    },
    'click .match-best': function() {
        logger.debug("Clicked best match button");
        logger.trace(this);
        // selectedDoc = this;
        if (getBest().fetch().length > 0) {
            var confirmMsg = "You can only have one best match at any given moment. If you continue, you will replace the current best match and relegate it to a possible match.";
            if (confirm(confirmMsg)) {
                // relegate current best match
                MatchManager.possibleMatch(Session.get("currentDoc"), getBest().fetch()[0]);
                // create new best
                MatchManager.bestMatch(Session.get("currentDoc"), this);
            }
        } else {
            MatchManager.bestMatch(Session.get("currentDoc"), this);    
        }
        // TODO call EventLogger
    }
})

var getMatches = function() {
    var allMatches = DocSearch.getData({
          transform: function(matchText, regExp) {
            return matchText.replace(regExp, "<b>$&</b>")
          },
          sort: {isoScore: -1}
        });
    var nonIdentityMatches = [];
    allMatches.forEach(function(m) {
        if ((m._id != Session.get("currentDoc")._id) && !(isPossibleMatch(m) || isBestMatch(m))) {
            nonIdentityMatches.push(m);
            
        }
    });
    // shuffle and note the rank in the search list
    nonIdentityMatches = shuffle(nonIdentityMatches);
    var ranks = {}
    var rank = 1;
    nonIdentityMatches.forEach(function(match) {
        ranks[match._id] = rank;
        rank += 1;
    })

    var data = {'matches': nonIdentityMatches, 'ranks': ranks}
    return data;
}

var getPossible = function() {
    var user = Session.get("currentUser");
    var docMatches = DocMatches.find({userID: user._id, seedDocID: Session.get("currentDoc")._id}).fetch();
    var matchingDocs = []
    docMatches.forEach(function(m) {
        if (!m.bestMatch) {
            matchingDocs.push(m.matchDocID);
        }
    });
    return Documents.find({_id: {$in: matchingDocs}});
}

var getBest = function() {
    var user = Session.get("currentUser");
    var docMatches = DocMatches.find({userID: user._id, seedDocID: Session.get("currentDoc")._id}).fetch();
    var matchingDocs = []
    docMatches.forEach(function(m) {
        if (m.bestMatch) {
            matchingDocs.push(m.matchDocID);
        }
    });
    return Documents.find({_id: {$in: matchingDocs}});
}

var isPossibleMatch = function(doc) {
    var user = Session.get("currentUser");
    var docMatch = DocMatches.findOne({userID: user._id, seedDocID: Session.get("currentDoc")._id, matchDocID: doc._id});
    if (docMatch) {
        return true;
    } else {
        return false;
    }
    // var selected = false;
    // for (i = 0; i < doc.matchIDs.length; i++) {
    //     if (doc.matchingDocs[i].userID == user._id) {
    //         selected = true;
    //         return selected;
    //     }
    // }
    // return selected;
}

var isBestMatch = function(doc) {
    var user = Session.get("currentUser");
    var docMatch = DocMatches.findOne({userID: user._id, seedDocID: Session.get("currentDoc")._id, matchDocID: doc._id});
    if (docMatch) {
        return docMatch.bestMatch;    
    } else {
        return false;
    }
}