vocab.data = (function () {

	var
		configMap = {
			resource_base : "http://vivo.brown.edu/individual/",
			search_base : null,
			rest_base : null
		},

		serviceDataProto,
		
		solr, rest, request, get,
		getTerm, makeTerm,
		initModule, configModule;

	serviceDataProto = {
		uri : null,
		label : null,
		links : [],
		etag : null,
		data : {}
	};

	makeServiceData = function ( resp, linkedAttrs, etag ) {
		var servData;

		servData = Object.create( serviceDataProto );

		if ( Object.keys(resp).length !== 1) {
			return false;
		}
		servData.uri = Object.keys( resp )[0];
		servData.data = resp[ servData.uri ];
		//JSON.parse side effect?
		delete servData.data.uri
		servData.label = servData.data.label[0];
		servData.etag = etag;
		servData.links = [];
		linkedAttrs.forEach( function (linkedAttr) {
			if (linkedAttr in servData.data) {
				servData.links.push.apply(servData.links, servData.data[linkedAttr]);
			}
		});

		return servData;
	};

	get = function ( url ) {
		//https://developers.google.com/web/fundamentals/getting-started/primers/promises
	  return new Promise(function(resolve, reject) {
	    var req = new XMLHttpRequest();
	    // for CORS
	    req.withCredentials = true;
	    
	    req.open('GET', url);

	    req.onload = function() {
	      if (req.status == 200) {
	        resolve({
						'data'	: JSON.parse(req.response),
						'etag'	: req.getResponseHeader('etag')
	        });
	      }
	      else {
	        reject(Error(req.statusText));
	      }
	    };

	    req.onerror = function() {
	      reject(Error("Network Error"));
	    };

	    req.send();
	  });
	};

	put = function ( url, jsonData, etag ) {
	  return new Promise(function(resolve, reject) {
	    var req = new XMLHttpRequest();
	    // for CORS
			req.withCredentials = true;

	    req.open('PUT', url);
	    req.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	    req.setRequestHeader('If-Match', etag);

	    req.onload = function() {
	      if (req.status == 200) {
	        resolve({
						'data'	: JSON.parse(req.response),
						'etag'	: req.getResponseHeader('etag')
	        });
	      }
	      else {
	        reject(Error(req.statusText));
	      }
	    };

	    req.onerror = function() {
	      reject(Error("Network Error"));
	    };

	    req.send(jsonData);
	  });
	};

	getServData = function ( url ) {
		return get( url ).then( function( respObj ) {
			data = JSON.parse(respObj.resp);
			etag = respObj.etag;
			term = makeTerm(data, etag);
			return term;
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

	//Begin Solr interface
	solr = (function () {
		var
			search;

		search = function ( term, callback ) {
			$.ajax({
				dataType: "json",
				url: configMap.search_base + "?query=" + term + "&type=vocab",
				success: function( data ) {
					callback( data );
				}
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
			find, update, describe;

		describe = function ( rabid, callback ) {
			$.ajax({
				dataType: "json",
				url: configMap.rest_base + 'describe/' + rabid,
				success: function( data ) {
					callback( data );
				}
			});
		};

		update = function ( updateArray, callback ) {
			$.ajax({
				data: JSON.stringify(updateArray),
				method: 'PUT',
				contentType: 'application/json',
				url: configMap.rest_base + 'update/',
				success: function( data ) {
					callback( data );
				}
			});
		};

		return {
			find 	: find,
			update  : update,
			describe : describe
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
