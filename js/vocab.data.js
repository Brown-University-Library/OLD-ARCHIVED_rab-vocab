data = (function () {

	var
		resource_base = "http://vivo.brown.edu/individual/",
		solr, rest, request;

	request = function ( params, callback ) {
		$.ajax({
			dataType: params.dataType,
	        type: params.type,
			url: params.url,
			data: params.data
		}).done( function(response) {
				callback(response);
		}).fail( function(xhr) {
			console.log(xhr);
		});
	};

	solr = (function () {
		var
			sorl_url = 'http://localhost:8080/rabsolr/',

			search, _processSolrResponse, makeSolrJSON;

		makeSolrJSON = function ( doc ) {
			var term = {};
			term.label = doc.nameRaw[0];
			term.uri = doc.URI;
			term.id = term.uri.substring(resource_base.length);
			return term;
		};

		_processSolrResponse = function ( solrResp ) {
			var i, doc, docs, solrData,
				jdata = [];
			if (solrResp.response.numFound > 0) {
				docs = solrResp.response.docs;
			}
			for ( i = 0; i < docs.length; i++ ) {
				doc = docs[i];
				solrData = makeSolrJSON(doc);
				jdata.push(solrData);
			}

			$( document ).trigger("solrUpdate", jdata);
		};

		search = function ( term ) {
			var
				solr_field_title = 'acNameStemmed:',
				solr_field_type = 'type:http://vivo.brown.edu/ontology/vivo-brown/ResearchArea',
				
				endpoint = sorl_url + 'select/',
				query = solr_field_title+term+" "+solr_field_type,

				params = {
					dataType : "html text json",
					type: "GET",
					url : endpoint,
					data : {
						"q" : query,
						"fl": "URI,nameRaw",
						"wt": "json"
					}
				};

			request( params, _processSolrResponse );
		};

		return {
			search : search
		};
	}());

	return {
		solr : solr
	};
}());