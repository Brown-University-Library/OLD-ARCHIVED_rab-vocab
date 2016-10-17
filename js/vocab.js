var labelURI = "<http://www.w3.org/2000/01/rdf-schema#label>";
var rabIndividualPrefix = "<http://vivo.brown.edu/individual/";
var vocabTermApi = "http://localhost:8000/rabdata/vocabmgmt/term/";
var inspectedResource;
var editingResource;

$(function() {
	$( "#solrResults" ).selectable({
		stop: function() {
			var details = $( "#solrDetailsList" ).empty();
			var rabid = $(".ui-selected").attr('id').substring("http://vivo.brown.edu/individual/".length, $(".ui-selected").attr('id').length);
			$.ajax({
				dataType: "json",
	            type:"GET",
				url: "http://localhost:8000/rabdata/vocabmgmt/term/"+rabid,
				success: function(response) {
					inspectedResource = response;
					var displayData = displayResourceData(inspectedResource);
					for (var prop in displayData) {
						details.append(
								'<li><strong>'+prop+'</strong>: '
								+ displayData[prop] +'</li>');
					}
					$("#solrResultDetails").removeClass("hidden");
				},
				error: function(xhr) {
					alert('error!');
				}
			});
		}
	});
});

$("#solrPing").find("#submit").on("click", function(e){
	e.preventDefault();
	$("#solrResults").empty();
	$("#solrDetailsLabel").empty();
	$( "#solrDetailsList" ).empty();
	var title='acNameStemmed:'+$(this).siblings("#query").val();
	var type='type:http://vivo.brown.edu/ontology/vivo-brown/ResearchArea';
	var query=title + " " + type;
	$.ajax({
		dataType: "html text json",
        type:"GET",
		url: "http://localhost:8080/rabsolr/select/",
		data: {
			"q": query,
			"fl": "URI,nameRaw",
			"wt": "json"
		},
		success: function(response) {
			if (response.response.numFound > 0) {
				listResearchAreas(response.response.docs);
			} else {
				$('#solrResults').append('<li>No results found</li>');
			}
		},
		error: function(xhr) {
			alert('error!');
		}
	});
});

function getshortIdfromRabid (rabid) {
	return rabid.substring(rabIndividualPrefix.length);
}

function getVocabTerm (rabid) {
	var shortId = getshortIdfromRabid(rabid);
	var termAPIUrl = vocabTermApi + shortId;
	$.ajax({
		dataType: "json",
        type:"GET",
		url: termAPIUrl,
		success: function(response) {
			return response;
		},
		error: function(xhr) {
			alert('error!');
		}
	});
}