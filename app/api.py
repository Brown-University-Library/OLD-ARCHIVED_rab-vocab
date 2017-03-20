import os
import datetime
import requests

from flask import request, render_template, jsonify
from app import app
from app.models import rab


solr_url = app.config['SOLR_URL']

@app.route('/')
def main():
	return render_template('vocab.html')


@app.route('/search/', methods=['GET'])
def solr_search():
	solr_endpoint = solr_url + 'select/'
	type_map = {
		'vocab' : 'type:http://vivo.brown.edu/ontology/vivo-brown/ResearchArea'
	}

	type_param = request.args.get('type')
	query_param = request.args.get('query')

	solr_field_title = 'acNameStemmed:'
	solr_field_type = type_map[type_param]
	query = solr_field_title + query_param + " " + solr_field_type
	
	payload = { "q" : query,
				"fl": "URI,nameRaw",
				"wt": "json",
				"rows": "30" }
	solr_resp = requests.get(solr_endpoint, params=payload)
	solr_data = solr_resp.json()
	reply = []
	if solr_data['response']['numFound'] > 0:
		for doc in solr_data['response']['docs']:
			res = {}
			res[doc['URI']] = { 'label': [ doc['nameRaw'][0] ] }
			reply.append(res)
	resp = make_response(
				json.dumps(reply))
	return resp


# ## API for R@B Vocabulary data
# from resources.vocab import Terms

# @app.route('/vocab/', methods=['GET'])
# def index_vocab_terms():
# 	# Working for single strings
# 	# problems for dates, multival?
# 	params = { k: [v] for k, v in request.args.items() }
# 	try:
# 		allTerms = Terms.search(params=params)
# 	except AliasError as e:
# 		raise RESTError('Bad parameter',
# 			status_code=400, payload=e.msg)
# 	except:
# 		raise RESTError('Resource not found', status_code=404)
# 	return json.dumps([ term.to_dict()
# 							for term in allTerms])

# @app.route('/vocab/<rabid>', methods=['GET'])
# def retrieve_vocab_term(rabid):
# 	try:
# 		term = Terms.find(rabid=rabid)
# 	except:
# 		raise RESTError('Resource not found', status_code=404)
# 	resp = make_response(
# 				json.dumps(term.to_dict()))
# 	resp.headers['ETag'] = term.etag
# 	return resp

# @app.route('/vocab/', methods=['POST'])
# def create_vocab_term():
# 	try:
# 		term = Terms.create(
# 					data=request.get_json())
# 	except (AliasError, ValidationError) as e:
# 		raise RESTError('Bad data',
# 					status_code=400, payload=e.msg) 
# 	resp = make_response(
# 				json.dumps(term.to_dict()))
# 	resp.headers['ETag'] = term.etag
# 	return resp

# @app.route('/vocab/<rabid>', methods=['PUT'])
# def replace_vocab_term(rabid):
# 	try:
# 		term = Terms.find(rabid=rabid)
# 	except:
# 		raise RESTError('Resource not found', status_code=404)
# 	if term.etag == request.headers.get("If-Match"):
# 		try:
# 			updated = Terms.overwrite(
# 						term, request.get_json())
# 		except (AliasError, ValidationError) as e:
# 			raise RESTError('Validation',
# 				status_code=400, payload=e.msg)
# 		resp = make_response(
# 				json.dumps(updated.to_dict()))
# 		resp.headers['ETag'] = updated.etag
# 		return resp
# 	else:
# 		raise RESTError('Data modified on server',
# 						status_code=409, payload=term.to_dict())

# @app.route('/vocab/<rabid>', methods=['DELETE'])
# def destroy_vocab_term(rabid):
# 	try:
# 		term = Terms.find(rabid=rabid)
# 	except:
# 		raise RESTError('No resource to delete', status_code=410)
# 	if term.etag == request.headers.get("If-Match"):
# 		try:
# 			Terms.remove(term)
# 			resp = make_response('', 204)
# 			return resp
# 		except (AliasError, ValidationError) as e:
# 			raise RESTError('Validation',
# 				status_code=400, payload=e.msg)
# 	else:
# 		raise RESTError('Data modified on server',
# 						status_code=409,
# 						payload=term.to_dict())