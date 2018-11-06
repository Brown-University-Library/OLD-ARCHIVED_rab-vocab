import re
import os
import sys
import requests
import collections
import json

def parse_uri(uriData):
    assert uriData.startswith('<')
    assert uriData.endswith('>')
    uri = uri[1:-1]
    assert uri.startswith('http://')
    return uri

def parse_dataval(dataVal):
    untyped = re.compile(r"^\".*\"$")
    typed = re.compile(r"\"\"\^\^xsd\:[a-zA-Z]{0,20}")
    if untyped.match(dataVal):
        return dataVal[1:-1]
    elif typed.match(dataVal):
        return dataVal[1:dataVal.rfind('"^^xsd')]
    else:
        raise

def parse_nt(ntText):
    # Need to eliminate 4th, unnamed capture group
    triple_pattern = re.compile(
        "(?P<Subject><[^>]*>) (?P<Predicate><[^>]*>) (?P<Object>(<[^>]*>|\".*\"\^\^xsd\:[a-zA-Z]{0,20}|\".*\")) \.")
    triples = [ split_triple(line, triple_pattern)
        for line in ntText.splitlines() ]
    return [ t for t in triples if t ]

def split_triple(line, regex):
    matched = regex.match(line)
    if matched:
        return (
            matched.group('Subject'), matched.group('Predicate'),
            matched.group('Object')
        )
    return False

def convert_triples_to_dicts(triples):
    dict_of_dicts = collections.defaultdict(
        lambda : collections.defaultdict(list))
    for triple in triples:
        dict_of_dicts[triple[0]][triple[1]].append(triple[2])
    return [ { uri: data }
                for uri, data in dict_of_dicts.items() ]

def query_concept(uri, email, pwd):
    # Output options:
    # 'nt', 'xml', 'json'
    query_endpoint = 'http://vivostaging.brown.edu:8080/vivo/api/sparqlQuery'
    rq = "CONSTRUCT{{{0}<http://www.w3.org/2000/01/rdf-schema#label>?label.{0}<http://www.w3.org/2004/02/skos/core#narrower>?n.{0}<http://www.w3.org/2004/02/skos/core#broader>?b.{0}<http://www.w3.org/2004/02/skos/core#related>?r.{0}<http://www.w3.org/2004/02/skos/core#altLabel>?a.{0}<http://www.w3.org/2004/02/skos/core#hiddenLabel>?h.{0}<http://www.w3.org/2004/02/skos/core#prefLabel>?p.}}WHERE{{{0}<http://www.w3.org/1999/02/22-rdf-syntax-ns#type><http://www.w3.org/2004/02/skos/core#Concept>.{0}<http://www.w3.org/2000/01/rdf-schema#label>?label.OPTIONAL{{{0}<http://www.w3.org/2004/02/skos/core#narrower>?n}}OPTIONAL{{{0}<http://www.w3.org/2004/02/skos/core#broader>?b}}OPTIONAL{{{0}<http://www.w3.org/2004/02/skos/core#related>?r}}OPTIONAL{{{0}<http://www.w3.org/2004/02/skos/core#altLabel>?a}}OPTIONAL{{{0}<http://www.w3.org/2004/02/skos/core#hiddenLabel>?h}}OPTIONAL{{{0}<http://www.w3.org/2004/02/skos/core#prefLabel>?p}}}}"
    query = rq.format(uri)
    payload = {
        'email': email,
        'password': pwd,
        'query': query,
        # 'output': 'nt'
    }
    header = {
        'Connection': 'close',
        'Accept': 'text/plain'
    }
    resp = requests.post(query_endpoint,
                           data=payload, headers=header)
    if resp.status_code == 200:
        return resp
    else:
        raise Exception("Failed get! {0}".format(resp.text))

def convert_data_to_obj(data):
    attr_map = {
        '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>' : 'class',
        '<http://www.w3.org/2000/01/rdf-schema#label>' : 'label',
        '<http://www.w3.org/2004/02/skos/core#altLabel>' : 'pref',
        '<http://www.w3.org/2004/02/skos/core#narrower>' : 'narrower',
        '<http://www.w3.org/2004/02/skos/core#broader>' : 'broader',
        '<http://www.w3.org/2004/02/skos/core#related>' : 'related',
        '<http://www.w3.org/2004/02/skos/core#hiddenLabel>' : 'hidden',
        '<http://www.w3.org/2004/02/skos/core#altLabel>' : 'alternative'
    }
    prop_funcs = {
        '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>': parse_uri,
        '<http://www.w3.org/2004/02/skos/core#narrower>': parse_uri,
        '<http://www.w3.org/2004/02/skos/core#broader>': parse_uri,
        '<http://www.w3.org/2004/02/skos/core#related>': parse_uri,
        '<http://www.w3.org/2000/01/rdf-schema#label>': parse_dataval,
        '<http://www.w3.org/2004/02/skos/core#altLabel>': parse_dataval,
        '<http://www.w3.org/2004/02/skos/core#hiddenLabel>': parse_dataval,
        '<http://www.w3.org/2004/02/skos/core#altLabel>': parse_dataval
    }
    assert len(data) == 1
    uri = parse_uri(list(data.keys())[0])
    obj = { 
        'id': uri,
        'label': [],
        'pref': [],
        'narrower': [],
        'broader': [],
        'related': [],
        'hidden': [],
        'alternative': []
    }
    for k, v in data[uri].items():
        try:
            func = prop_funcs[k]
            parsed = [ func(d) for d in v ]
            obj[ attr_map[k] ].extend(parsed)
        except:
            raise('Unexpected data')
    return obj

def main(pwd):
    uri = '<http://vivo.brown.edu/individual/n81665>'
    email = 'Steven_McCauley@brown.edu'
    resp = query_concept(uri, email, pwd)
    parsed = parse_nt(resp.text)
    data = convert_triples_to_dicts(parsed)
    objs = [ convert_data_to_obj(d) for d in data ]
    print(objs)

if __name__ == '__main__':
    pwd = sys.argv[1]
    main(pwd)

# class RABObject(object):

#     rdf_type = None

#     def __init__(self, uri=None, id=None, existing=True):
#         self.uri_ns = namespaces.RABID
#         self.existing = existing
#         self.label = None
#         self.etag = None
#         if id and uri:
#             self.id = id
#             self.uri = uri
#         elif uri and not id:
#             self.uri = uri
#             self.id = uri[len(self.uri_ns):]
#         elif id and not uri:
#             self.id = id
#             self.uri = self.uri_ns + id
#         if self.existing:
#             self.retrieve()

#     def publish(self):
#         return dict(id=self.id, uri=self.uri, display=self.label, data=self.data)

#     def retrieve(self):
#         resp = requests.get(self.rab_api + self.id)
#         if resp.status_code == 200:
#             self.etag = resp.headers.get('ETag')
#             data = resp.json()
#             rab_uri = data.keys()[0]
#             assert rab_uri == self.uri
#             self.load_data(data)
#         else:
#             self.data = dict()
#             self.existing = False

#     def load_data(self, data):
#         self.uri = data.keys()[0]
#         self.id = self.uri[len(self.uri_ns):]
#         attrs = data[self.uri]
#         self.label = attrs['label'][0]
#         self.data = attrs
#         self.existing = True

#     @classmethod
#     def factory(cls, data):
#         uri = data.keys()[0]
#         rdfType = data[uri]['class']
#         ##
#         ## Currently, RAB-REST does not return subclass data,
#         ## making this ineffective. Returning subclass data will
#         ## require Dozer modifications. Revisit if necessary
#         # if cls.__subclasses__():
#         #   for klass in cls.__subclasses__():
#         #       if klass.rdf_type == rdfType:
#         #           rab_obj = klass()
#         #           rab_obj.load_data(data)
#         #           return rab_obj
#         # else:
#         if cls.rdf_type == rdfType:
#             rab_obj = cls(existing=False)
#             rab_obj.load_data(data)
#             return rab_obj

#     @classmethod
#     def list(cls, params=None):
#         resp = requests.get(cls.rab_api, params=params)
#         if resp.status_code == 200:
#             idx = [] 
#             for data in resp.json():
#                 new_rab = cls.factory(data)
#                 idx.append(new_rab)
#             return idx
#         else:
#             raise

#     @classmethod
#     def all(cls, params=None):
#         resp = requests.get(cls.rab_api, params=params)
#         if resp.status_code == 200:
#             idx = [] 
#             for data in resp.json():
#                 uri = data.keys()[0]
#                 new_rab = cls(uri=uri)
#                 idx.append(new_rab)
#             return idx
#         else:
#             raise

# class ResearchArea(Object):

#     ns = {
#         'skos' : 'http://www.w3.org/2004/02/skos/core#',
#         'rdfs' : 'http://www.w3.org/2000/01/rdf-schema#',
#         'rdf' : 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
#     }

#     attr_map = {
#         'class' : '<http://www.w3.org/2004/02/skos/core#Concept>',
#         'label' : '<http://www.w3.org/2000/01/rdf-schema#label>',
#         'pref' : '<http://www.w3.org/2004/02/skos/core#altLabel>',
#         'narrower' : '<http://www.w3.org/2004/02/skos/core#narrower>',
#         'broader' : '<http://www.w3.org/2004/02/skos/core#broader>',
#         'related' : '<http://www.w3.org/2004/02/skos/core#related>',
#         'hidden' : '<http://www.w3.org/2004/02/skos/core#hiddenLabel>',
#         'alternative' : '<http://www.w3.org/2004/02/skos/core#altLabel>'
#     }

#     @classmethod
#     def get(cls, uri):
#         try:
#             rsp = vstore.query(rq)
#             return rsp.graph
#         except ResultException:
#             print("No non-BrownThing faculty to hide.".format(rq))
#             return Graph()

#     def _validate(self, data):
#         attrs = [ 'class', 'label', 'narrower', 'broader', 'related',
#                     'hidden', 'alternative' ]
#         required = [ 'class', 'label' ]
#         optional = [ 'narrower', 'broader', 'related',
#                         'hidden', 'alternative' ]
#         obj_props = [ 'narrower', 'broader', 'related' ]
#         data['class'] = self.rdf_type
#         for opt in optional:
#             if opt not in data:
#                 data[opt] = []
#         for req in required:
#             assert data[req]
#         for prop in obj_props:
#             for d in data[prop]:
#                 assert d.startswith('http://')
#         return data

#     def update(self, new_data):
#         valid = self._validate(new_data)
#         payload = { self.uri: valid }
#         headers = { 'Content-Type': 'application/json' }
#         resp = requests.put(self.rab_api + self.id, data=json.dumps(payload), headers=headers)
#         if resp.status_code == 200:
#             self.etag = resp.headers.get('ETag')
#             data = resp.json()
#             rab_uri = data.keys()[0]
#             assert rab_uri == self.uri
#             self.load_data(data)
#         return resp

#     def __init__(self, uri=None, id=None, existing=True):
#         super(ResearchArea, self).__init__(uri=uri, id=id, existing=existing)

