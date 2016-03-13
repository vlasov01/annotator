Template.finishPage.helpers({
    completeCode : function() {
        console.log("Retrieving completion code");
        // var code = Random.hexString(20).toLowerCase();
        var code = DocMatches.findOne({_id: Session.get("finishedMatchID")}).completionCode;
        return code;
    }
});