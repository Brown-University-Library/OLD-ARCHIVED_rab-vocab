vocab.data = (function () {

	var
		resource_base = "http://vivo.brown.edu/individual/",
		solr, rest, request, initModule, get;

	// request = function ( params, callback ) {
	// 	$.ajax({
	// 		dataType: params.dataType,
	//         type: params.type,
	// 		url: params.url,
	// 		data: params.data
	// 	}).done( function(response) {
	// 			callback(response);
	// 	}).fail( function(xhr) {
	// 		console.log(xhr);
	// 	});
	// };

	request = function ( params ) {
		return $.ajax({
			dataType: params.dataType,
	        type: params.type,
			url: params.url,
			data: params.data,
			headers: params.headers,
			contentType: params.contentType
		});
	};

	//Begin Solr interface
	solr = (function () {
		var
			sorl_url = 'http://localhost:8080/solr/',

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

			request( params )
			.done( function ( resp ) {
				_processSolrResponse(resp);
			});
		};

		return {
			search : search
		};
	}());
	//end Solr interface

	//Begin REST interface
	rest = (function () {
		var
			find, update, makeRESTObj, update,
			_processFind,
			rest_base = 'http://localhost:8000/vocab/';

		makeRESTObj = function ( jdata, etag ) {
			var
				uri, data,
				term = {};

			if ( Object.keys(jdata).length !== 1) {
				return false;
			}
			uri = Object.keys(jdata)[0];
			data = jdata[uri];
			term.uri = uri;
			term.id = term.uri.substring(resource_base.length);
			term.label = data.label[0];
			term.etag = etag;
			term.data = {
				'broader' : data.broader,
				'narrower' : data.narrower,
				'related' : data.related,
				'hidden' : data.hidden,
				'alternative' : data.alternative
			};

			return term
		};

		_processFind = function ( resp ) {
			var jdata;
				jdata = makeRESTObj( resp );

				$( window ).trigger('restFind', [{data: jdata}]);

			return true;
		};

		find = function ( rabid, callback ) {
			var
				term, neighbors, ajax_calls,
				tmp_rabid, tmp_url, tmp_rest,
				rest_url = rest_base + rabid,
				params = {
					dataType : "html text json",
					type: "GET",
					url : rest_url,
				};

			request( params )
			.then( function(resp, _, xhr) {
				var etag = xhr.getResponseHeader('etag');
				term = makeRESTObj(resp, etag);
				vocab.model.terms.updateTerm(term);

				neighbors = [];

				for (key in term.data) {
					neighbors.push.apply(neighbors, term.data[key]);
				}

				var res = {term: term, neighbors: neighbors};
				return res;
			})
			.then( function(data) {
				ajax_calls = [];
				for (var i=0, len=data.neighbors.length; i < len; i++) {
					tmp_rabid = data.neighbors[i].substring(resource_base.length),
					tmp_url = rest_base + tmp_rabid;
					params.url = tmp_url;
					ajax_calls.push(
						$.ajax({
							dataType: "html text json",
					  	type: "GET",
							url: tmp_url,
							success: function(resp){
								tmp_rest = makeRESTObj(resp);
								vocab.model.terms.updateTerm(tmp_rest);
    					}
						})
					);
				}

				$.when.apply(null,ajax_calls)
					.done( function() {
						callback(data.term)
				});
			});
		};

		update = function ( term, callback ) {
			var
				label, uri, rest_url,
				data, params,
				payload = {}, 
				etag;

			label = [term.label];
			uri = term.uri;
			console.log(uri);
			rest_url = rest_base + term.id;
			data = term.data;
			data.label = label;
			data.class = ['http://www.w3.org/2004/02/skos/core#Concept'];
			etag = term.etag;
			payload[uri] = data ;
			params = {
				dataType : "json",
				contentType: 'application/json; charset=UTF-8',
				type: "PUT",
				data: JSON.stringify(payload),
				url : rest_url,
				headers: {"If-Match": etag}
			};

			console.log( params );
			request( params )
			.then( function(resp) {
				callback(resp);
			});
		};

		return {
			find 	: find,
			update  : update
		};
	}());

	initModule = function (){};

	return {
		initModule : initModule,
		solr : solr,
		rest : rest
	};
}());