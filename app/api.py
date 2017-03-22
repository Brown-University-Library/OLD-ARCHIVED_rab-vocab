import os
import datetime
import requests
import json

from flask import request, render_template, jsonify, make_response
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
			res = { 'uri': doc['URI'],
				'display': doc['nameRaw'][0],
				'id': doc['URI'][33:],
				'data': {}
				}
			reply.append(res)
	resp = make_response(
				json.dumps(reply))
	return resp

@app.route('/describe/<rabid>', methods=['GET'])
def describe_term(rabid):
	term = rab.ResearchArea(id=rabid)
	linked_attrs = ['broader','narrower','related']
	neighbor_uris = []
	for attr in linked_attrs:
		neighbor_uris.extend( term.data[attr] )
	out = [ rab.ResearchArea(uri=uri) for uri in neighbor_uris ]
	out.append(term)
	return jsonify( [ ra.publish() for ra in out ] )

@app.route('/update/', methods=['PUT'])
def update_terms():
	data = request.get_json()
	existing = [ rab.ResearchArea(uri=obj['uri']) for obj in data ]
	for term in existing:
		for obj in data:
			if term.uri == obj['uri']:
				term.update(obj['data'])
	return jsonify([ ex.publish() for ex in exitsing ])

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
