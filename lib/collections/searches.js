var logger = new Logger('collections:Searches');

Logger.setLevel('collections:Searches', 'trace');
// Logger.setLevel('collections:Searches', 'debug');
// Logger.setLevel('collections:Searches', 'info');
// Logger.setLevel('collections:Searches', 'warn');

Searches = new Mongo.Collection('searches');

Search = function(query, matches, seed, user) {

    this.time = new Date().getTime();

    this.query = query;

    this.matches = matches

    this.seedDocID = seed._id;

    this.userID = user._id;

}

SearchManager = (function() {
    return {
        newSearch: function(query, matches) {
            /******************************************************************
             *****************************************************************/
            var user = Session.get("currentUser");
            var currentDoc = Session.get("currentDoc");
            var search = new Search(query, matches, currentDoc, user);
            search._id = Searches.insert(search);
            return search;
            // return getRandomElement(documents);
        },
    }
}());