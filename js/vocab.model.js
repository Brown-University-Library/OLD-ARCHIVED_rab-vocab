vocab.model = (function () {
	var


		terms, makeTerm, termProto;

		searchTermProto = {
			uri : null,
			get_id : function () {
				return uri.substring(resource_base.length);
			},
		};

		makeSearch = function( solr_doc ) {
			var term = {};
			term.label = solr_doc.nameRaw[0];
			term.uri = solr_doc.URI;
			term.id = term.uri.substring(resource_base.length);
		};		

		terms = (function () {
			var
				_publish_listchange
		}());
}());