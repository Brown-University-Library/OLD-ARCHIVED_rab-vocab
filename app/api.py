import os
import datetime
import requests
import json


from flask import request, render_template, jsonify, make_response, url_for
from app import app
from app.models import rab
from app.stats import vocab

solr_url = app.config['SOLR_URL']
vdash = vocab.Stats()
vdash.load_data()

@app.route('/')
def main():
	config = {
				'search_base': url_for('solr_search'),
				'rest_base': url_for('main')
			}
	return render_template('home.html', config=config)

@app.route('/dashboard/reload/')
def reload_dashboard():
	vdash.load_data()

@app.route('/depts/')
def dept_dashboard():
	dept_data = vdash.department_summary()
	data = { 'depts': dept_data }
	return render_template('dashboard_depts.html', data=data)

@app.route('/terms/<term_group>')
def terms_dashboard(term_group):
	term_data = vdash.term_summary(term_group)
	data = { 'terms': term_data }
	return render_template('dashboard_terms.html', data=data)

@app.route('/depts/<dept_id>')
def department_details(dept_id):
	dept_data = vdash.department_details(dept_id)
	return render_template('department_detail.html', data=dept_data)

@app.route('/terms/<term_id>')
def term_details(term_id):
	term_data = vdash.term_details(term_id)
	return render_template('term_detail.html', data=term_data)

@app.route('/particles/<particle>')
def particles(particle):
	resp = requests.get('http://dvivocit1.services.brown.edu/rabdata/vocab/')
	data = resp.json()
	terms = [ (d[obj]['label'][0], obj)for d in data for obj in d ]
	atoms = [ (re.split('\W+', t[0].lower()), t[0], t[1]) for t in terms ]
	rev = collections.defaultdict(list)
	for atom in atoms:
		for a in atom[0]:
			rev[a].append(atom[2])
	labels = { a[2]: a[1] for a in atoms }
	uris = rev[particle]
	merge = [ { 'uri': uri, 'label': labels[uri] } for uri in uris ]
	return render_template('particles.html', data=merge)
	

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
	to_be_updated = [ (obj['data'], rab.ResearchArea(uri=obj['uri'])) for obj in data ]
	success = []
	for new_data, existing in to_be_updated:
		resp = existing.update(new_data)
		if resp.status_code == 200:
			success.append(existing.uri)
		else:
			print "Failure: " + existing.uri
			print resp.text
	return jsonify(success)
