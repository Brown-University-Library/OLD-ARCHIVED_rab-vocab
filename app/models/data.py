from SPARQLWrapper import SPARQLWrapper, JSON

from app import app

query_endpoint = app.config['VIVO_ENDPOINT']

sparql = SPARQLWrapper(query_endpoint)
sparql.setReturnFormat(JSON)

def vocabulary_faculty_counts():
    sparql.setQuery("""
        PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
        PREFIX vivo: <http://vivoweb.org/ontology/core#>
        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

        SELECT ?uri (COUNT(?uri) as ?c)
        WHERE {
                ?uri rdf:type skos:Concept .
                ?uri vivo:researchAreaOf ?fac .
        }
        GROUP BY ?uri
    """)
    results = sparql.query().convert()
    out = [ {'uri': result['uri']['value'], 'count': result['c']['value']}
            for result in results["results"]["bindings"] ]
    return out