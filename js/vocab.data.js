vocab.data = (function () {

	var
		configMap = {
			resource_base : "http://vivo.brown.edu/individual/",
			search_base : null,
			rest_base : null
		},
		
		solr, rest, request,
		initModule, configModule;

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
			search, makeSearchObj;

		makeSearchObj = function ( result ) {
			var term = {};
			term.uri = Object.keys(result)[0];
			term.label = result[term.uri];
			term.id = term.uri.substring(configMap.resource_base.length);
			return term;
		};

		search = function ( term, callback ) {
			var
				data,
				search_url = configMap.search_base+"?query="+term+"&type=vocab",
				params = {
					dataType : "html text json",
					type : "GET",
					url : search_url
				};
			request( params )
			.done( function ( resp ) {
				data = [];
				for (var i=0; i < resp.length; i++) {
					search_res = resp[i];
					searchObj = makeSearchObj(search_res);
					data.push(searchObj);
				}

				callback(data);
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
			find, update, makeApiObj;

		makeApiObj = function ( resp, etag ) {
			var
				uri, data,
				term = {};

			if ( Object.keys(resp).length !== 1) {
				return false;
			}
			uri = Object.keys(resp)[0];
			data = resp[uri];
			term.uri = uri;
			term.id = term.uri.substring(configMap.resource_base.length);
			term.label = data.label[0];
			term.etag = etag;
			if ('neighbors' in data) {
				term.neighbors = data.neighbors;
			}
			term.data = {
				'broader' : data.broader,
				'narrower' : data.narrower,
				'related' : data.related,
				'hidden' : data.hidden,
				'alternative' : data.alternative
			};

			return term
		};

		find = function ( rabid, callback ) {
			var
				rest_url = configMap.rest_base + rabid + "?neighbors=True",
				params = {
					dataType : "html text json",
					type: "GET",
					url : rest_url
				};

			return request( params )
			.then( function(resp, _, xhr) {
				var
					etag, foundObj,
					respObj, nbor;
				etag = xhr.getResponseHeader('etag');

				foundObj = makeApiObj(resp, etag);
				callback(foundObj);

				if ('neighbors' in foundObj) {
					for (var i=0; i < foundObj.neighbors.length; i++) {
						nbor = foundObj.neighbors[i];
						respObj = makeApiObj(nbor, null);
						callback(respObj);
					}
				}

				return resp;
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

	configModule = function ( config ) {
		configMap.search_base = config.search_base;
		configMap.rest_base = config.rest_base;
	};

	initModule = function (){};

	return {
		configModule : configModule,
		initModule : initModule,
		solr : solr,
		rest : rest
	};
}());
