vocab.data = (function () {

	var
		resource_base = "http://vivo.brown.edu/individual/",
		solr, rest, request, initModule;

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

	//Begin Solr interface
	solr = (function () {
		var
			sorl_url = 'http://localhost:8080/rabsolr/',

			search, _processSolrResponse, makeSolrObj;

		makeSolrObj = function ( doc ) {
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
				for ( i = 0; i < docs.length; i++ ) {
					doc = docs[i];
					solrData = makeSolrObj(doc);
					jdata.push(solrData);
				}
			}

			$( window ).trigger("solrUpdate", [{data: jdata}]);
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
						"wt": "json",
						"rows": "30"
					}
				};

			request( params, _processSolrResponse );
		};

		return {
			search : search
		};
	}());
	//end Solr interface

	//Begin REST interface
	rest = (function () {
		var
			find, update, makeRESTObj,
			_processFind,
			rest_base = 'http://localhost:8000/vocab/';

		makeRESTObj = function ( jdata ) {
			var
				uri, data,
				term = {};

			if ( Object.keys(jdata).length !== 1) {
				alert(jdata);
				return false;
			}
			uri = Object.keys(jdata)[0];
			data = jdata[uri];
			term.uri = uri;
			term.id = term.uri.substring(resource_base.length);
			term.label = data.label;
			term.broader = data.broader;
			term.narrower = data.narrower;
			term.related = data.related;
			term.hidden = data.hidden;
			term.alternative = data.alternative;

			return term
		};

		_processFind = function ( resp ) {
			var jdata;
				jdata = makeRESTObj( resp );

				$( window ).trigger('restFind', [{data: jdata}]);
		};

		find = function ( rabid ) {
			var
				res_url = rest_base + rabid,
				params = {
					dataType : "html text json",
					type: "GET",
					url : res_url,
				};

			request( params, _processFind );
		}

		return {
			find : find
		};
	}());

	initModule = function (){};

	return {
		initModule : initModule,
		solr : solr,
		rest : rest
	};
}());