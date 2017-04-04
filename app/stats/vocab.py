from SPARQLWrapper import SPARQLWrapper, JSON
import re
import collections
import pandas as pd
import os
import csv

from app import app

query_endpoint = app.config['VIVO_ENDPOINT']
viz_dir = app.config['VISUALS_DIR']
data_dir = app.config['STATS_DATA_DIR']

sparql = SPARQLWrapper(query_endpoint)
sparql.setReturnFormat(JSON)


##Need to add validity checks;
##Discrepancies appear in affiliation counts
##See dept_summary vs SPARQL query for Pediatrics

def query_faculty_terms_data():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX bprofile: <http://vivo.brown.edu/ontology/profile#>
        PREFIX blocal: <http://vivo.brown.edu/ontology/vivo-brown/>

        SELECT ?fac ?term
        WHERE {
                ?term rdf:type skos:Concept .
                {?term vivo:researchAreaOf ?fac .}
                UNION
                {?term bprofile:specialtyFor ?fac .}
                UNION
                {?term blocal:geographicResearchAreaOf ?fac .}
        }
    """)
    results = sparql.query().convert()
    out = [ (result['fac']['value'], result['term']['value'])
                for result in results["results"]["bindings"] ]
    return out

def query_faculty_affiliations_data():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX bprofile: <http://vivo.brown.edu/ontology/profile#>
        PREFIX blocal: <http://vivo.brown.edu/ontology/vivo-brown/>

        SELECT ?fac ?dept
        WHERE {
                ?fac a vivo:FacultyMember .
                ?fac blocal:hasAffiliation ?dept .
        }
        """)
    results = sparql.query().convert()
    out = [ (result['fac']['value'], result['dept']['value'])
                for result in results["results"]["bindings"] ]
    return out

def query_term_data():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX bprofile: <http://vivo.brown.edu/ontology/profile#>
        PREFIX blocal: <http://vivo.brown.edu/ontology/vivo-brown/>
        PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?term ?label ?id
        WHERE {
                ?term rdf:type skos:Concept .
                ?term rdfs:label ?label .
                BIND(substr(str(?term), 34) as ?id) .
        }
        """)
    results = sparql.query().convert()
    out = list({
            (result['term']['value'],
                result['label']['value'], result['id']['value'])
                    for result in results["results"]["bindings"] })
    return out

def query_faculty_data():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX bprofile: <http://vivo.brown.edu/ontology/profile#>
        PREFIX blocal: <http://vivo.brown.edu/ontology/vivo-brown/>
        PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?fac ?label ?id
        WHERE {
                ?fac a vivo:FacultyMember .
                ?fac rdfs:label ?label .
                BIND(substr(str(?fac), 34) as ?id) .
        }
        """)
    results = sparql.query().convert()
    out = list({
            (result['fac']['value'],
                result['label']['value'], result['id']['value'])
                    for result in results["results"]["bindings"] })
    return out

def query_department_data():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX bprofile: <http://vivo.brown.edu/ontology/profile#>
        PREFIX blocal: <http://vivo.brown.edu/ontology/vivo-brown/>
        PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?dept ?label ?id
        WHERE {
                ?fac a vivo:FacultyMember .
                ?fac blocal:hasAffiliation ?dept .
                ?dept rdfs:label ?label .
                BIND(substr(str(?dept), 34) as ?id) .
        }
        """)
    results = sparql.query().convert()
    out = list({
            (result['dept']['value'],
                result['label']['value'], result['id']['value'])
                    for result in results["results"]["bindings"] })
    return out

def write_query_results_csv(func, fName):
    tuple_data = func()
    with open( os.path.join(data_dir, fName + '.csv'), 'w+') as f:
        wrtr = csv.writer(f)
        for row in tuple_data:
            wrtr.writerow( [ r.encode('utf-8') for r in row ] )

def load_csv_data(fName):
    out = []
    with open( os.path.join(data_dir, fName + '.csv'), 'rb') as f:
        rdr = csv.reader(f)
        for row in rdr:
            out.append(row)
    return out

def download_data():
    jobs = [    (query_term_data, 'terms'),
                (query_faculty_data, 'faculty'),
                (query_department_data, 'departments'),
                (query_faculty_terms_data, 'fac_terms'),
                (query_faculty_affiliations_data, 'fac_depts')
            ]
    for job in jobs:
        write_query_results_csv(job[0], job[1])


class Stats(object):

    def __init__(self):
        self.faculty = None
        self.departments = None
        self.terms = None
        self.affiliations = None
        self.interests = None

    def load_data(self):
        term_data = load_csv_data('terms')
        faculty_data = load_csv_data('faculty')
        department_data = load_csv_data('departments')
        faculty_terms_data = load_csv_data('fac_terms')
        faculty_departments_data = load_csv_data('fac_depts')
        self.terms = pd.DataFrame(
            data=term_data, columns=['term_uri', 'term_label', 'term_id'])
        self.faculty = pd.DataFrame(
            data=faculty_data, columns=['fac_uri', 'fac_label', 'fac_id'])
        self.departments = pd.DataFrame(
            data=department_data, columns=['dept_uri', 'dept_label', 'dept_id'])
        self.faculty_terms = pd.DataFrame(
            data=faculty_terms_data, columns=['fac_uri', 'term_uri'])
        self.faculty_departments = pd.DataFrame(
            data=faculty_departments_data, columns=['fac_uri', 'dept_uri'])
        self.department_terms = self.faculty_departments.merge(
                                    self.faculty_terms, on='fac_uri', how='inner' ) \
                                    .drop('fac_uri', 1).drop_duplicates()

    def department_summary(self):
        dept_faccount = self.faculty_departments.groupby('dept_uri') \
                            .size().reset_index()
        dept_uniqueterms = self.department_terms.groupby('dept_uri') \
                            .size().reset_index()
        fac_termcount = self.faculty_terms.groupby('fac_uri') \
                            .size().reset_index()
        dept_termcount = self.faculty_departments.merge(
                            fac_termcount, on='fac_uri', how='left') \
                            .fillna(0).drop('fac_uri',axis=1)
        dept_mean = dept_termcount.groupby('dept_uri') \
                        .mean().round(1).reset_index()
        dept_median = dept_termcount.groupby('dept_uri') \
                        .median().reset_index()
        dept_summ = self.departments.merge(
                        dept_faccount, on='dept_uri', how='left') \
                        .merge(dept_uniqueterms, on='dept_uri', how='left') \
                            .fillna(0) \
                        .merge(dept_mean, on='dept_uri', how='left') \
                        .merge(dept_median, on='dept_uri', how='left')
        dept_summ.columns = [   'dept_uri', 'dept_label', 'dept_id',
                                'fac_count', 'unique_terms',
                                'mean', 'median']
        # dept_summ['reusage'] = dept_summ.apply(
        #                             lambda row: round(
        #                                 float(row['term_count']) / row['unique_terms'],
        #                                 2),
        #                             axis=1)
        return dept_summ.to_dict('records')


    def department_details(self, dept_id):
        dept_row = self.departments \
                .loc[ self.departments['dept_id'] == dept_id ] \
                .values[0]
        aff_uris = self.faculty_departments \
                .loc[ self.faculty_departments['dept_uri'] == dept_row[0] ] \
                ['fac_uri'].values
        fac_termcount = self.faculty_terms \
                            [ self.faculty_terms['fac_uri'].isin(aff_uris) ] \
                            .groupby('fac_uri') \
                            .size().reset_index()
        fac_summ = self.faculty[ self.faculty['fac_uri'].isin(aff_uris) ] \
                    .merge(fac_termcount, on='fac_uri', how='left')
        fac_summ.columns = [ 'fac_uri', 'fac_label', 'fac_id', 'term_count' ]
        fac_summ['term_count'] = fac_summ['term_count'].fillna(0).astype(int)
        fac_summ['bins'] = pd.cut(
                            fac_summ['term_count'], [ 0, 1, 4, 9, 15, 100 ],
                            right=False, include_lowest=True,
                            labels=['0','1-3','4-8','9-14','15+'])
        hrz_bar = fac_summ['bins'].value_counts() \
                .reindex(['0','1-3','4-8','9-14','15+']).plot(kind='barh')
        figure = hrz_bar.get_figure()
        figure.savefig(os.path.join(viz_dir, 'dept_viz_'+dept_row[2]+'.png'))
        figure.clear()
        return { 'uri': dept_row[0], 'label': dept_row[1], 'id': dept_row[2] }

    def faculty_summary(self):
        fac_termcount = self.faculty_terms.groupby('fac_uri') \
                            .size().reset_index()
        fac_summ = self.faculty.merge(
                        fac_termcount, on='fac_uri', how='left')
        fac_summ.columns = [ 'fac_uri', 'fac_label', 'term_count' ]
        fac_summ['term_count'] = fac_summ['term_count'].fillna(0).astype(int)
        return fac_summ.to_dict('records')

    def term_summary(self):
        term_faccount = self.faculty_terms.groupby('term_uri') \
                            .size().reset_index()
        term_summ = self.terms.merge(term_faccount, on='term_uri', how='left')
        term_summ.columns = ['term_uri', 'term_label', 'fac_count']
        term_summ['fac_count'] = term_summ['fac_count'].fillna(0).astype(int)
        return term_summ.to_dict('records')