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
    return render_template('detail_department.html', data=dept_data)

@app.route('/terms/details/<term_id>')
def term_details(term_id):
    term_data = vdash.term_details(term_id)
    return render_template('detail_term.html', data=term_data)

@app.route('/faculty/details/<fac_id>')
def faculty_details(fac_id):
    fac_data = vdash.faculty_details(fac_id)
    return render_template('detail_faculty.html', data=fac_data)

@app.route('/particles/details/<particle>')
def particle_details(particle):
    particle_data = vdash.particle_details(particle)
    return render_template('detail_particle.html', data=particle_data)

@app.route('/search/', methods=['GET'])
def solr_search():
    solr_endpoint = solr_url + 'select/'
    type_map = {
        'vocab' : 'type:http://www.w3.org/2004/02/skos/core#Concept'
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
    term = rab.ResearchArea.get(rabid)
    linked_attrs = ['broader','narrower','related']
    neighbor_uris = []
    for attr in linked_attrs:
        neighbor_uris.extend( getattr(term, attr) )
    out = [ rab.ResearchArea.get(uri) for uri in neighbor_uris ]
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
            print("Failure: " + existing.uri)
            print(resp.text)
    return jsonify(success)
