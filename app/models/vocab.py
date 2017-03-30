from SPARQLWrapper import SPARQLWrapper, JSON
import re
import collections
import pandas as pd

from app import app

query_endpoint = app.config['VIVO_ENDPOINT']

sparql = SPARQLWrapper(query_endpoint)
sparql.setReturnFormat(JSON)

##Need to add validity checks;
##Discrepancies appear in affiliation counts
##See dept_summary vs SPARQL query for Pediatrics

def faculty_terms_data():
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

def faculty_affiliations_data():
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

def term_data():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX bprofile: <http://vivo.brown.edu/ontology/profile#>
        PREFIX blocal: <http://vivo.brown.edu/ontology/vivo-brown/>
        PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?term ?label
        WHERE {
                ?term rdf:type skos:Concept .
                ?term rdfs:label ?label .
        }
        """)
    results = sparql.query().convert()
    out = list({ (result['term']['value'], result['label']['value'])
                for result in results["results"]["bindings"] })
    return out

def faculty_data():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX bprofile: <http://vivo.brown.edu/ontology/profile#>
        PREFIX blocal: <http://vivo.brown.edu/ontology/vivo-brown/>
        PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?fac ?label
        WHERE {
                ?fac a vivo:FacultyMember .
                ?fac rdfs:label ?label .
        }
        """)
    results = sparql.query().convert()
    out = list({ (result['fac']['value'], result['label']['value'])
                for result in results["results"]["bindings"] })
    return out

def department_data():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
        PREFIX bprofile: <http://vivo.brown.edu/ontology/profile#>
        PREFIX blocal: <http://vivo.brown.edu/ontology/vivo-brown/>
        PREFIX rdfs:     <http://www.w3.org/2000/01/rdf-schema#>

        SELECT DISTINCT ?dept ?label
        WHERE {
                ?fac a vivo:FacultyMember .
                ?fac blocal:hasAffiliation ?dept .
                ?dept rdfs:label ?label .
        }
        """)
    results = sparql.query().convert()
    out = list({ (result['dept']['value'], result['label']['value'])
                for result in results["results"]["bindings"] })
    return out

class Data(object):

    def __init__(self):
        self.faculty = None
        self.departments = None
        self.terms = None
        self.affiliations = None
        self.interests = None
        self.load()

    def load(self):
        self.terms = pd.DataFrame(
            data=term_data(), columns=['term_uri', 'term_label'])
        self.faculty = pd.DataFrame(
            data=faculty_data(), columns=['fac_uri', 'fac_label'])
        self.departments = pd.DataFrame(
            data=department_data(), columns=['dept_uri', 'dept_label'])
        self.faculty_terms = pd.DataFrame(
            data=faculty_terms_data(), columns=['fac_uri', 'term_uri'])
        self.faculty_departments = pd.DataFrame(
            data=faculty_affiliations_data(), columns=['fac_uri', 'dept_uri'])
        self.department_terms = self.faculty_departments.merge(
                                    self.faculty_terms, on='fac_uri', how='left' ) \
                                    .drop('fac_uri', 1)

    def department_summary(self):
        dept_faccount = self.faculty_departments.groupby('dept_uri') \
                            .size().reset_index()
        dept_termcount = self.department_terms.drop_duplicates() \
                            .groupby('dept_uri').size().reset_index()
        dept_summ = self.departments.merge(
                        dept_faccount, on='dept_uri', how='left') \
                        .merge(dept_termcount, on='dept_uri', how='left')
        dept_summ.columns = [ 'dept_uri', 'dept_label', 'fac_count', 'term_count' ]
        return dept_summ.to_dict('records')

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