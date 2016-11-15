vocab.data = (function () {

	var
		configMap = {
			resource_base : "http://vivo.brown.edu/individual/",
			search_base : null,
			rest_base : null
		},
		
		solr, rest, request, get,
		getTerm, makeTerm,
		initModule, configModule;

	get = function ( url ) {
		//https://developers.google.com/web/fundamentals/getting-started/primers/promises
	  // Return a new promise.
	  return new Promise(function(resolve, reject) {
	    // Do the usual XHR stuff
	    var req = new XMLHttpRequest();
	    // for CORS
	    req.withCredentials = true;
	    
	    req.open('GET', url);

	    req.onload = function() {
	      // This is called even on 404 etc
	      // so check the status
	      if (req.status == 200) {
	        // Resolve the promise with the response text
	        resolve({ 'resp'	: req.response,
	        					'etag'	: req.getResponseHeader('etag')
	        				});
	      }
	      else {
	        // Otherwise reject with the status text
	        // which will hopefully be a meaningful error
	        reject(Error(req.statusText));
	      }
	    };

	    // Handle network errors
	    req.onerror = function() {
	      reject(Error("Network Error"));
	    };

	    // Make the request
	    req.send();
	  });
	};

	getTerm = function ( url ) {
  	return get( url ).then( function( respObj ) {
  		data = JSON.parse(respObj.resp);
			etag = respObj.etag;
			term = makeTerm(data, etag);
			return term;
  	});
	};

	makeTerm = function ( resp, etag ) {
		var
			uri, data,
			term = {};

		if ( Object.keys(resp).length !== 1) {
			return false;
		}
		uri = Object.keys(resp)[0];
		data = resp[uri];
		term.uri = uri;
		term.rabid = term.uri.substring(configMap.resource_base.length);
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
			term.rabid = term.uri.substring(configMap.resource_base.length);
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
			find, update;

		find = function ( rabid ) {
			var
				i, len, key,
				data, etag, term,
				nbor, nbors,
				n_rabid, n_url,
				
				rest_url = configMap.rest_base + rabid;

			getTerm( rest_url ).then( function(term) {
				vocab.model.updateTerm(term);

				nbors = [];
				for (key in term.data) {
					if (term.data[key] !== []) {
						for ( i=0, len=term.data[key].length; i < len; i++) {
							nbor = term.data[ key ][ i ];
							n_rabid = nbor.substring(configMap.resource_base.length);
							n_url = configMap.rest_base + n_rabid;
							nbors.push(n_url);
						}
					} 
				}

				return Promise.all(
					nbors.map(getTerm)
				);
			})
			.then( function (terms) {
				terms.forEach( function ( term ) {
					vocab.model.updateTerm( term );
				});
				return rabid;
			})
		};

		update = function ( term, callback ) {
			var
				label, uri, rest_url,
				data, params,
				payload = {}, 
				etag;

			label = [term.label];
			uri = term.uri;
			rest_url = configMap.rest_base + term.id;
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
		rest : rest,
		getTerm : getTerm
	};
}());
