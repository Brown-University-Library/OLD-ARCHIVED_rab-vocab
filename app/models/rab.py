import re
import os
import sys
import requests
import collections
import json

from app import app

def parse_uri(uriData):
    assert uriData.startswith('<')
    assert uriData.endswith('>')
    uri = uriData[1:-1]
    assert uri.startswith('http://')
    return uri

untyp_pattern = re.compile(r"^\".*\"$")
typ_pattern = re.compile(r"\"\"\^\^xsd\:[a-zA-Z]{0,20}")
def parse_dataval(dataVal):
    if untyp_pattern.match(dataVal):
        return dataVal[1:-1]
    elif typ_pattern.match(dataVal):
        return dataVal[1:dataVal.rfind('"^^xsd')]
    else:
        raise

def parse_object(objData):
    if objData.startswith('<'):
        return parse_uri(objData)
    else:
        return parse_dataval(objData)

triple_pattern = re.compile(
    "(?P<Subject><[^>]*>) (?P<Predicate><[^>]*>) (?P<Object>(<[^>]*>|\".*\"\^\^xsd\:[a-zA-Z]{0,20}|\".*\")) \.")
def parse_nt(ntText):
    # Need to eliminate 4th, unnamed capture group
    triples = [ split_triple(line, triple_pattern)
        for line in ntText.splitlines() ]
    return [ t for t in triples if t ]

def split_triple(line, regex):
    matched = regex.match(line)
    if matched:
        sbj = parse_uri(matched.group('Subject'))
        pred = parse_uri(matched.group('Predicate'))
        obj = parse_object(matched.group('Object'))
        return ( sbj, pred, obj )
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
    query_endpoint = app.config['VIVO_ENDPOINT']
    rq = "CONSTRUCT{{<{0}><http://www.w3.org/2000/01/rdf-schema#label>?label.<{0}><http://www.w3.org/2004/02/skos/core#narrower>?n.<{0}><http://www.w3.org/2004/02/skos/core#broader>?b.<{0}><http://www.w3.org/2004/02/skos/core#related>?r.<{0}><http://www.w3.org/2004/02/skos/core#altLabel>?a.<{0}><http://www.w3.org/2004/02/skos/core#hiddenLabel>?h.<{0}><http://www.w3.org/2004/02/skos/core#prefLabel>?p.}}WHERE{{<{0}><http://www.w3.org/1999/02/22-rdf-syntax-ns#type><http://www.w3.org/2004/02/skos/core#Concept>.<{0}><http://www.w3.org/2000/01/rdf-schema#label>?label.OPTIONAL{{<{0}><http://www.w3.org/2004/02/skos/core#narrower>?n}}OPTIONAL{{<{0}><http://www.w3.org/2004/02/skos/core#broader>?b}}OPTIONAL{{<{0}><http://www.w3.org/2004/02/skos/core#related>?r}}OPTIONAL{{<{0}><http://www.w3.org/2004/02/skos/core#altLabel>?a}}OPTIONAL{{<{0}><http://www.w3.org/2004/02/skos/core#hiddenLabel>?h}}OPTIONAL{{<{0}><http://www.w3.org/2004/02/skos/core#prefLabel>?p}}}}"
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
        'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' : 'class',
        'http://www.w3.org/2000/01/rdf-schema#label' : 'label',
        'http://www.w3.org/2004/02/skos/core#altLabel' : 'pref',
        'http://www.w3.org/2004/02/skos/core#narrower' : 'narrower',
        'http://www.w3.org/2004/02/skos/core#broader' : 'broader',
        'http://www.w3.org/2004/02/skos/core#related' : 'related',
        'http://www.w3.org/2004/02/skos/core#hiddenLabel' : 'hidden',
        'http://www.w3.org/2004/02/skos/core#altLabel' : 'alternative'
    }
    obj = { 
        'label': [],
        'pref': [],
        'narrower': [],
        'broader': [],
        'related': [],
        'hidden': [],
        'alternative': []
    }
    for k, v in data.items():
        try:
            obj[ attr_map[k] ].extend(v)
        except:
            raise('Unexpected data')
    return obj

class ResearchArea:

    def __init__(self, uri, data={}):
        self.uri = uri
        self.label = []
        self.pref = []
        self.narrower = []
        self.broader = []
        self.related = []
        self.hidden = []
        self.alternative = []
        self._load(data)

    def __repr__(self):
        return "ResearchArea {0}".format(self.uri)
    
    def __str__(self):
        return "{0}".format(self.label[0] or 'Unnamed')

    def _load(self, data):
        for d in data:
            # if d == 'uri' or d == 'id':
            #     continue
            try:
                setattr(self, d, data[d])
            except:
                raise

    @classmethod
    def get(cls, uri):
        email = app.config['ADMIN_EMAIL']
        pwd = app.config['ADMIN_PASSWORD']
        # email = 'Steven_McCauley@brown.edu'
        # pwd = 'wave$2Mo0n'
        if not uri.startswith('http://'):
            uri = 'http://vivo.brown.edu/individual/{}'.format(uri)
        try:
            resp = query_concept(uri, email, pwd)
        except:
            print("Query error")
            return {}
        parsed = parse_nt(resp.text)
        data = convert_triples_to_dicts(parsed)
        keyed = [ d[uri] for d in data ]
        assert len(keyed) == 1
        objs = [ convert_data_to_obj(k) for k in keyed ]
        ra = cls(uri, objs[0])
        return ra
    
    def publish(self):
        data = { 
            'label': self.label,
            'pref': self.pref,
            'narrower': self.narrower,
            'broader': self.broader,
            'related': self.related,
            'hidden': self.hidden,
            'alternative': self.alternative
        }
        return dict(id=self.uri, uri=self.uri, display=self.label, data=data)

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

