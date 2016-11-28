var logger = new Logger('collections:WordManager');

Logger.setLevel('collections:WordManager', 'trace');
// Logger.setLevel('collections:WordManager', 'debug');
// Logger.setLevel('collections:WordManager', 'info');
// Logger.setLevel('collections:WordManager', 'warn');

Words = new Mongo.Collection('words');

Word = function (content, sequence, globalPsn, sentence) {

    this.sentenceID = sentence._id;
    this.docID = sentence.docID;

    // the word (string)
    this.content = content;

    // the word's position in the sentence
    this.sequence = sequence;

    // the word's global position in the document
    this.globalPsn = globalPsn;

    // highlights - array of userIDs
    // who have highlighted this word
    this.highlightsPurpose = [];
    this.highlightsMechanism = [];
}

WordManager = (function() {
    return {
        markWord: function(wordID, userID, type) {
            /******************************************************************
             * Mark the word with appropriate annotation for that user
             * @params
             *    wordID - the id of the word being annotated
             *    userID - the user making the annotation
             *    type (str) - problem, mechanism, or neither
             *****************************************************************/
            var previousState = this.getCurrentState(wordID, userID);
            if (type === "Purpose") {
                logger.debug("Adding " + userID + " to highlightsPurpose for " + wordID);
                Words.update({_id: wordID},{$addToSet: {highlightsPurpose: userID}});
                Words.update({_id: wordID},{$pull: {highlightsMechanism: userID}});
                EventLogger.logMarkPurpose(wordID, previousState);
            } else if (type === "Mechanism") {
                logger.debug("Adding " + userID + " to highlightsMechanism for " + wordID);
                Words.update({_id: wordID},{$pull: {highlightsPurpose: userID}});
                Words.update({_id: wordID},{$addToSet: {highlightsMechanism: userID}});
                EventLogger.logMarkMechanism(wordID, previousState);
            } else {
                logger.debug("Neither: un-annotating");
                Words.update({_id: wordID},{$pull: {highlightsPurpose: userID}});
                Words.update({_id: wordID},{$pull: {highlightsMechanism: userID}});
                EventLogger.logUnmarkWord(wordID, previousState);
            }
            return true;
        },
        getCurrentState: function(wordID, userID) {
            var word = Words.findOne({_id: wordID});
            if (isInList(userID, word.highlightsPurpose)) {
                return "Purpose";
            } else if (isInList(userID, word.highlightsMechanism)) {
                return "Mechanism";
            } else {
                return "Unmarked";
            }
        },
    }
}());
