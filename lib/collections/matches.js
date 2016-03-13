var logger = new Logger('collections:MatchManager');

Logger.setLevel('collections:MatchManager', 'trace');
// Logger.setLevel('collections:MatchManager', 'debug');
// Logger.setLevel('collections:MatchManager', 'info');
// Logger.setLevel('collections:MatchManager', 'warn');

DocMatches = new Mongo.Collection('docMatches');

DocMatch = function(seedDoc, matchDoc, user) {

    this.seedDocID = seedDoc._id;

    this.matchDocID = matchDoc._id;

    this.userID = user._id;

    this.bestMatch = false;

    this.summary = "";

    this.completionCode = "";

}

MatchManager = (function() {
    return {
        possibleMatch: function(seedDoc, matchDoc, query, rank) {
            /******************************************************************
             * Add a match link between seedDoc and matchDoc
             * @params
             *    seedDoc - the seed document
             *    matchDoc - the document to be matched to the seed doc
             *****************************************************************/
            var user = Session.get("currentUser");
            var oldMatch = DocMatches.findOne({userID: user._id,
                                            seedDocID: seedDoc._id,
                                            matchDocID: matchDoc._id});
            if (oldMatch) {
                logger.debug("Already a match between " + seedDoc._id + " and " + matchDoc._id + ". Checking if best match.");
                // Unmark as a best match if it was a best match
                if (oldMatch.bestMatch) {
                    DocMatches.update({_id: oldMatch._id},{$set: {bestMatch: false}});
                }
                EventLogger.logPossibleMatch(matchDoc, "best");
            } else {
                logger.debug(user.userName + " is adding match between " + seedDoc._id + " and " + matchDoc._id);
                var match = new DocMatch(seedDoc, matchDoc, user);
                match._id = DocMatches.insert(match);
                Documents.update({_id: seedDoc._id},{$addToSet: {matchIDs: match._id}});
                EventLogger.logPossibleMatch(matchDoc, "notMatch");
                return match;
            }
        },
        notMatch: function(seedDoc, matchDoc, query, rank) {
            var user = Session.get("currentUser");
            logger.debug(user.userName + " is removing match between " + seedDoc._id + " and " + matchDoc._id);
            var toRemove = DocMatches.findOne({userID: user._id,
                                            seedDocID: seedDoc._id,
                                            matchDocID: matchDoc._id});
            if (toRemove) {
                logger.trace("Existing match: " + JSON.stringify(toRemove));
                DocMatches.remove({_id: toRemove._id});
                Documents.update({_id: seedDoc._id},{$pull: {$matchIDs: toRemove._id}});
                var previousState = "best";
                if (!toRemove.bestMatch) {
                    previousState = "possible"
                }
                EventLogger.logRejectMatch(matchDoc, previousState);
                // toRemove.forEach(function(t) {
                //     DocMatches.remove({_id: t._id});
                //     // Documents.update({_id: seedDoc._id},{$pull: {$matchIDs: t._id}});
                // });
                return true;
            } else {
                logger.debug("Already not a match");
                return false;
            }
        },
        bestMatch: function(seedDoc, matchDoc, query, rank) {
            var user = Session.get("currentUser");
            logger.debug(user.userName + " is marking " + matchDoc._id + " as best match for " + seedDoc._id);
            var oldMatch = DocMatches.findOne({userID: user._id,
                                            seedDocID: seedDoc._id,
                                            matchDocID: matchDoc._id});
            if (oldMatch) {
                logger.trace("Marking existing match as best match");
                DocMatches.update({_id: oldMatch._id},{$set: {bestMatch: true}});
                EventLogger.logBestMatch(matchDoc, "possible");
                return oldMatch;
                // return true;
            } else {
                logger.trace("Making a new best match");
                var newMatch = new DocMatch(seedDoc, matchDoc, user);
                newMatch.bestMatch = true;
                newMatch._id = DocMatches.insert(newMatch);
                Documents.update({_id: seedDoc._id},{$addToSet: {matchIDs: newMatch._id}});
                EventLogger.logBestMatch(matchDoc, "notMatch");
                return newMatch;
                // return false;
            }
        },
    }
}());