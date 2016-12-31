var logger = new Logger('Documents:read');
// Comment out to use global logging level
Logger.setLevel('Documents:read', 'trace');

Meteor.methods({
  getSample( filter ) {
	//logger.debug("Documents sampling for user: "+filter);
	//db.getCollection('documents').aggregate({ $sample: { size: 1 } }).result[0]._id

    let UserID = filter;
	let hasAnnotated = true;

	do {
		let result = Documents.aggregate({ $sample: { size: 1 } });
		var sampledDoc = result[0];
		if (!isInList(UserID, sampledDoc.annotatedBy)) {
		 hasAnnotated = false;
		}
	} while (hasAnnotated);
	
	//logger.debug("Explain documents:", JSON.stringify(result), null, 2);
	//logger.debug("Explain documents:"+sampledDoc._id);
	return sampledDoc;
  },
  getSentences( filter ) {
	//logger.debug("Sentences for docID: "+filter);
	//db.getCollection('sentences').find({docID: "XsuaJpy6JCgmpAQjy"}).sort({psn: 1})
	let sentences = Sentences.find({docID: filter}, { sort: {psn: 1} }).fetch();
	//logger.debug("Explain documents:"+sentences[0].content);
	return sentences;
  },
  getWords( filter ) {
	//logger.debug("Words for sentence: "+filter);
	let words = Words.find({docID: filter},{sort: { sequence : 1 }}).fetch();
	//logger.debug("Explain words:"+words[0].content);
	return words;
  },
  getWord( filter ) {
	//logger.debug("Words for sentence: "+filter);
	let word = Words.findOne({_id: filter}).fetch();
	//logger.debug("Explain words:"+words[0].content);
	return word;
  }
});