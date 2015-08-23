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

}

MatchManager = (function() {
    return {
        addMatch: function(seedDoc, matchDoc) {
            /******************************************************************
             * Add a match link between seedDoc and matchDoc
             * @params
             *    seedDoc - the seed document
             *    matchDoc - the document to be matched to the seed doc
             *****************************************************************/
            var user = Session.get("currentUser");
            logger.debug(user.userName + " is adding match between " + seedDoc._id + " and " + matchDoc._id);
            var match = new DocMatch(seedDoc, matchDoc, user);
            match._id = DocMatches.insert(match);
            Documents.update({_id: seedDoc._id},{$addToSet: {matchIDs: match._id}});
            return match;
        },
        removeMatch: function(seedDoc, matchDoc) {
            var user = Session.get("currentUser");
            logger.debug(user.userName + " is removing match between " + seedDoc._id + " and " + matchDoc._id);
            var toRemove = DocMatches.find({userID: user._id,
                                            seedDocID: seedDoc._id,
                                            matchDocID: matchDoc._id});
            logger.trace(toRemove);
            if(toRemove) {
                toRemove.forEach(function(t) {
                    DocMatches.remove({_id: t._id});
                    // Documents.update({_id: seedDoc._id},{$pull: {$matchIDs: t._id}});
                });
                return true;
            } else {
                return false;
            }
        }
    }
}());