import os
import requests

from app import app
from app.utils import namespaces

rest_base = app.config['REST_BASE']


class RABObject(object):

	rdf_type = None

	def __init__(self, uri=None, id=None, existing=True):
		self.uri_ns = namespaces.RABID
		self.existing = existing
		self.label = None
		self.etag = None
		if id and uri:
			self.id = id
			self.uri = uri
		elif uri and not id:
			self.uri = uri
			self.id = uri[len(self.uri_ns):]
		elif id and not uri:
			self.id = id
			self.uri = self.uri_ns + id
		if self.existing:
			self.retrieve()

	def publish(self):
		return dict(id=self.id, uri=self.uri, display=self.label, data=self.data)

	def retrieve(self):
		resp = requests.get(self.rab_api + self.id)
		if resp.status_code == 200:
			self.etag = resp.headers.get('ETag')
			data = resp.json()
			rab_uri = data.keys()[0]
			assert rab_uri == self.uri
			self.load_data(data)
		else:
			self.data = dict()
			self.existing = False

	def load_data(self, data):
		self.uri = data.keys()[0]
		self.id = self.uri[len(self.uri_ns):]
		attrs = data[self.uri]
		self.label = attrs['label'][0]
		self.data = attrs
		self.existing = True

	@classmethod
	def factory(cls, data):
		uri = data.keys()[0]
		rdfType = data[uri]['class']
		##
		## Currently, RAB-REST does not return subclass data,
		## making this ineffective. Returning subclass data will
		## require Dozer modifications. Revisit if necessary
		# if cls.__subclasses__():
		# 	for klass in cls.__subclasses__():
		# 		if klass.rdf_type == rdfType:
		# 			rab_obj = klass()
		# 			rab_obj.load_data(data)
		# 			return rab_obj
		# else:
		if cls.rdf_type == rdfType:
			rab_obj = cls(existing=False)
			rab_obj.load_data(data)
			return rab_obj

	@classmethod
	def list(cls, params=None):
		resp = requests.get(cls.rab_api, params=params)
		if resp.status_code == 200:
			idx = [] 
			for data in resp.json():
				new_rab = cls.factory(data)
				idx.append(new_rab)
			return idx
		else:
			raise

	@classmethod
	def all(cls, params=None):
		resp = requests.get(cls.rab_api, params=params)
		if resp.status_code == 200:
			idx = [] 
			for data in resp.json():
				uri = data.keys()[0]
				new_rab = cls(uri=uri)
				idx.append(new_rab)
			return idx
		else:
			raise

class ResearchArea(RABObject):

	rdf_type = [ namespaces.SKOS + "Concept" ]
	rab_api = os.path.join(rest_base, 'vocab/')

	def update(self, updated_data):
		updated_data['class'] = self.rdf_type
		self.data = updated_data
		headers = { 'ETag': self.etag }
		resp = requests.put(self.rab_api, data=self.data, headers=headers)
		if resp.status_code == 200:
			self.etag = resp.headers.get('ETag')
			data = resp.json()
			rab_uri = data.keys()[0]
			assert rab_uri == self.uri
			self.load_data(data)
		else:
			raise "Bad update"

	def __init__(self, uri=None, id=None, existing=True):
		super(ResearchArea, self).__init__(uri=uri, id=id, existing=existing)
