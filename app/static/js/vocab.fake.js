vocab.fake = (function () {

	//Begin Solr JSON response
  solrResp = {
	  "responseHeader": {
	    "status": 0,
	    "QTime": 21,
	    "params": {
	      "fl": "URI,nameRaw",
	      "indent": "true",
	      "q": "acNameStemmed:Russia\ntype:http://vivo.brown.edu/ontology/vivo-brown/ResearchArea",
	      "_": "1476721111130",
	      "wt": "json"
	    }
	  },
	  "response": {
	    "numFound": 7,
	    "start": 0,
	    "docs": [
	      {
	        "nameRaw": [
	          "Russian",
	          "[Russian]"
	        ],
	        "URI": "http://vivo.brown.edu/individual/n62674"
	      },
	      {
	        "nameRaw": [
	          "Russia",
	          "[Russia]"
	        ],
	        "URI": "http://vivo.brown.edu/individual/n62659"
	      },
	      {
	        "nameRaw": [
	          "Russian Federation",
	          "[Russian Federation]"
	        ],
	        "URI": "http://vivo.brown.edu/individual/n78899"
	      },
	      {
	        "nameRaw": [
	          "Russian government",
	          "[Russian government]"
	        ],
	        "URI": "http://vivo.brown.edu/individual/n67604"
	      },
	      {
	        "nameRaw": [
	          "Russian theatre",
	          "[Russian theatre]"
	        ],
	        "URI": "http://vivo.brown.edu/individual/n48610"
	      },
	      {
	        "nameRaw": [
	          "task-based Russian language instruction",
	          "[task-based Russian language instruction]"
	        ],
	        "URI": "http://vivo.brown.edu/individual/n9446"
	      },
	      {
	        "nameRaw": [
	          "comparative linguistics in Russian Sign Language (RSL) and American Sign Language (ASL)",
	          "[comparative linguistics in Russian Sign Language (RSL) and American Sign Language (ASL)]"
	        ],
	        "URI": "http://vivo.brown.edu/individual/n57141"
	      }
	    ]
	  },
	  "highlighting": {
	    "vitroIndividual:http://vivo.brown.edu/individual/n62674": {},
	    "vitroIndividual:http://vivo.brown.edu/individual/n62659": {},
	    "vitroIndividual:http://vivo.brown.edu/individual/n78899": {},
	    "vitroIndividual:http://vivo.brown.edu/individual/n67604": {},
	    "vitroIndividual:http://vivo.brown.edu/individual/n48610": {},
	    "vitroIndividual:http://vivo.brown.edu/individual/n9446": {},
	    "vitroIndividual:http://vivo.brown.edu/individual/n57141": {}
	  }
	};
	//End Solr JSON response

});