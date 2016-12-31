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
	
	this.wordDep = undefined;
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
            let previousState = this.getCurrentState(wordID, userID);
			let _word = WordManager.findOne(wordID);
            if (type === "Purpose") {
                logger.debug("Adding " + userID + " to highlightsPurpose for " + wordID);
				_word.highlightsPurpose.push(userID);
				_word.highlightsMechanism.pop(userID);
                Words.update({_id: wordID},{$addToSet: {highlightsPurpose: userID}});
                Words.update({_id: wordID},{$pull: {highlightsMechanism: userID}});
                EventLogger.logMarkPurpose(wordID, previousState);
            } else if (type === "Mechanism") {
                logger.debug("Adding " + userID + " to highlightsMechanism for " + wordID);
				_word.highlightsMechanism.push(userID);
				_word.highlightsPurpose.pop(userID);
                Words.update({_id: wordID},{$pull: {highlightsPurpose: userID}});
                Words.update({_id: wordID},{$addToSet: {highlightsMechanism: userID}});
                EventLogger.logMarkMechanism(wordID, previousState);
            } else {
                logger.debug("Neither: un-annotating");
				_word.highlightsMechanism.pop(userID);
				_word.highlightsPurpose.pop(userID);
                Words.update({_id: wordID},{$pull: {highlightsPurpose: userID}});
                Words.update({_id: wordID},{$pull: {highlightsMechanism: userID}});
                EventLogger.logUnmarkWord(wordID, previousState);
            }
			WordManager.updateOne(_word);
            return true;
        },
        markOneWord: function(word, userID, type) {
            /******************************************************************
             * Mark the word with appropriate annotation for that user
             * @params
             *    word - the word being annotated
             *    userID - the user making the annotation
             *    type (str) - problem, mechanism, or neither
             *****************************************************************/
            let previousState = this.getCurrentState(word._id, userID);
            if (type === "Purpose") {
                logger.debug("Adding " + userID + " to highlightsPurpose for " + word._id);
				word.highlightsPurpose.push(userID);
				word.highlightsMechanism.pop(userID);
                Words.update({_id: word._id},{$addToSet: {highlightsPurpose: userID}});
                Words.update({_id: word._id},{$pull: {highlightsMechanism: userID}});
                EventLogger.logMarkPurpose(word._id, previousState);
            } else if (type === "Mechanism") {
                logger.debug("Adding " + userID + " to highlightsMechanism for " + word._id);
				word.highlightsMechanism.push(userID);
				word.highlightsPurpose.pop(userID);
                Words.update({_id: word._id},{$pull: {highlightsPurpose: userID}});
                Words.update({_id: word._id},{$addToSet: {highlightsMechanism: userID}});
                EventLogger.logMarkMechanism(word._id, previousState);
            } else {
                logger.debug("Neither: un-annotating");
				word.highlightsMechanism.pop(userID);
				word.highlightsPurpose.pop(userID);
                Words.update({_id: word._id},{$pull: {highlightsPurpose: userID}});
                Words.update({_id: word._id},{$pull: {highlightsMechanism: userID}});
                EventLogger.logUnmarkWord(word._id, previousState);
            }
			WordManager.updateOne(word);
            return true;
        },
        getCurrentState: function(wordID, userID) {
            //var word = Words.findOne({_id: wordID});
			let _word = WordManager.findOne(wordID);
            if (isInList(userID, _word.highlightsPurpose)) {
                return "Purpose";
            } else if (isInList(userID, _word.highlightsMechanism)) {
                return "Mechanism";
            } else {
                return "Unmarked";
            }
        },
		findOne: function(wordID) {
			let words = Session.get("words")
			//logger.debug("Words:"+words);
			var result; 
			words.forEach(function(w) {
				if (w._id == wordID) {
					result = w;
					return w;
				}
			});
			return result;
		 },
		updateOne: function(word) {
			let words = Session.get("words")
			//logger.debug("Words:"+words);
			words.forEach(function(w) {
				if (w._id == word._id) {
					w.highlightsMechanism = word.highlightsMechanism;
					w.highlightsPurpose = word.highlightsPurpose;
					Session.set("words",words);
				}
			});
		 },
	 }
}());
