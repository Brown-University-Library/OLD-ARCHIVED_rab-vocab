import matplotlib
matplotlib.use('Agg')

from SPARQLWrapper import SPARQLWrapper, JSON
import re
import collections
import pandas as pd
import numpy as np
import os
import csv
from scipy import stats as scipystats

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
            out.append([ r.decode('utf-8') for r in row ])
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


## FILTERS
def contains_nonalpha(d):
    ptn = re.compile('[^a-zA-Z ]')
    if re.search(ptn, d):
        return True
    else:
        return False

def contains_and(d):
    if re.search(' and ', d):
        return True
    else:
        return False

def contains_in(d):
    if re.search(' in ', d):
        return True
    else:
        return False

def contains_4_or_more_words(d):
    ptn = re.compile('[ -()/]')
    ps = [ p for p in re.split(ptn, d) if p != '' ]
    if len(ps) > 3:
        return True
    else:
        return False

def longer_than_40_chars(d):
    if len(d) > 40:
        return True
    else:
        return False

class Stats(object):

    def __init__(self):
        self.faculty = None
        self.departments = None
        self.terms = None
        self.faculty_departments = None
        self.faculty_terms = None
        self.particles = None

    def load_data(self):
        term_data = load_csv_data('terms')
        faculty_data = load_csv_data('faculty')
        department_data = load_csv_data('departments')
        faculty_terms_data = load_csv_data('fac_terms')
        faculty_departments_data = load_csv_data('fac_depts')
        self.terms = pd.DataFrame(
            data=term_data, columns=['term_uri', 'term_label', 'term_id']) \
            .sort_values(by='term_label')
        self.terms['particles'] = self.terms['term_label'] \
                                .str.lower() \
                                .str.replace('\.', '') \
                                .str.replace('\W+',' ') \
                                .str.replace(' +(and|in|to|of|s|the|with) +', ' ') \
                                .str.replace(' +(and|in|to|of|s|the|with) +', ' ') \
                                .str.strip() \
                                .str.split(' ')
        self.particles = self.terms.groupby('term_uri').particles \
                            .apply(lambda x: pd.DataFrame(x.values[0])) \
                            .reset_index().drop('level_1',1)
        self.particles.columns = [ 'term_uri', 'particle' ]
        self.terms = self.terms.drop('particles', 1)
        self.faculty = pd.DataFrame(
            data=faculty_data, columns=['fac_uri', 'fac_label', 'fac_id']) \
            .sort_values(by='fac_label')
        self.departments = pd.DataFrame(
            data=department_data, columns=['dept_uri', 'dept_label', 'dept_id']) \
            .sort_values(by='dept_label')
        self.faculty_terms = pd.DataFrame(
            data=faculty_terms_data, columns=['fac_uri', 'term_uri'])
        counts = pd.DataFrame(self.faculty_terms \
                    .groupby('term_uri').size() \
                    .rename('count').reset_index())
        self.terms = self.terms.merge(counts, on='term_uri', how='left')
        self.terms['count'] = self.terms[ 'count' ].fillna(0).astype(int)
        self.faculty_departments = pd.DataFrame(
            data=faculty_departments_data, columns=['fac_uri', 'dept_uri'])
        self.department_terms = self.faculty_departments.merge(
                                    self.faculty_terms, on='fac_uri', how='inner' ) \
                                    .drop('fac_uri', 1)
        self.department_particles = self.department_terms.merge( \
                                        self.particles, on='term_uri', how='inner')
        self.term_pairs = self.faculty_terms.merge(
                            self.faculty_terms, on='fac_uri', how='inner') \
                            .drop('fac_uri', 1)
        self.term_pairs.columns = ['term_uri', 'coterm_uri']
        # self.term_pairs = self.term_pairs.drop( \
        #                     self.term_pairs[ self.term_pairs['term_uri'] \
        #                         == self.term_pairs['coterm_uri'] ].index)
        self.particle_pairs = self.particles.merge(self.particles, on='term_uri', how='inner')
        self.particle_pairs.columns = ['term_uri', 'particle', 'coparticle']

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
        hrz_bar.set(xlabel='# of Faculty Members', ylabel='# of Terms')
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

    def term_summary(self, term_group=None):
        if term_group == 'titlecase':
            func = unicode.istitle
        elif term_group == 'withand':
            func = contains_and
    	elif term_group == 'within':
            func = contains_in
        elif term_group == 'nonalpha':
            func = contains_nonalpha
        elif term_group == 'manywords':
            func = contains_4_or_more_words
        elif term_group == 'toolong':
            func = longer_than_40_chars
        filtered = self.terms[ self.terms['term_label'].map(func) ]
        term_deptcount = self.department_terms.groupby('term_uri') \
                            .size().reset_index()
        term_summ = filtered \
                        .merge(term_deptcount, on='term_uri', how='left') 
        term_summ.columns = [   'term_uri', 'term_label', 'term_id', 
                                'fac_count', 'dept_count']
        term_summ['dept_count'] = term_summ['dept_count'].fillna(0).astype(int)
        return term_summ.to_dict('records')

    def term_details(self, term_id):
        term_data = self.terms[ self.terms['term_id'] == term_id ] \
                        .to_dict('records')[0]
        term_parts = self.particles[ \
                        self.particles['term_uri'] == term_data['term_uri'] ]
        matched_parts = self.particles[ self.particles['particle'] \
                            .isin(term_parts['particle'])] \
                            .merge(self.terms, on='term_uri', how='inner') \
                            .groupby('particle')
        faculty = self.faculty_terms[ \
                        self.faculty_terms['term_uri'] == term_data['term_uri'] ]
        by_faculty = self.faculty_terms[ \
                        self.faculty_terms['fac_uri'].isin(faculty['fac_uri']) ]
        by_dept = by_faculty \
                    .merge(self.terms, on="term_uri", how='inner') \
                    .merge(self.faculty_departments, on='fac_uri', how='inner') \
                    .merge(self.departments, on='dept_uri', how='inner') \
                    .merge(self.faculty, on='fac_uri', how='inner') \
                    .groupby('dept_label')
        cousins = [ {   'particle': group,
                        'rows': matched_parts \
                            .get_group(group).to_dict('records') }
                    for group in matched_parts.groups ]
        siblings = [ {  'dept': dept,
                        'faculty': by_dept \
                            .get_group(dept)[['fac_id','fac_label']] \
                            .drop_duplicates().to_dict('records'),
                        'rows': by_dept \
                            .get_group(dept).to_dict('records') }
                    for dept in by_dept.groups ]
        scores = self.corr(term_data['term_uri'])
        return {
                'id': term_data['term_id'], 'label': term_data['term_label'],
                'uri': term_data['term_uri'], 'count': term_data['count'],
                'cousins': cousins, 'siblings': siblings,
                'major': scores['major'], 'minor': scores['minor'] }

    def faculty_details(self, fac_id):
        fac_data = self.faculty[ self.faculty['fac_id'] == fac_id ] \
                    .to_dict('records')[0]
        fac_terms = self.faculty_terms[ \
                        self.faculty_terms['fac_uri'] == fac_data['fac_uri'] ] \
                        .merge(self.terms, on='term_uri', how='inner')
        fac_parts = self.particles[ \
                        self.particles['term_uri'].isin(fac_terms['term_uri']) ]
        counts = self.particles[ \
                        self.particles['particle'].isin(fac_parts['particle'])] \
                        .groupby('particle').size().reset_index() \
                        .rename(columns={0:'count'})
        parts_data = fac_parts.merge(counts, on='particle', how='left') \
                        .to_dict('records')
        term_data = fac_terms.to_dict('records')
        return {
                'id': fac_data['fac_id'], 'label': fac_data['fac_label'],
                'uri': fac_data['fac_uri'], 'terms': term_data,
                'particles': parts_data }

    def particle_details(self, particle):
        parts = self.particles[ self.particles['particle'] == particle ] \
                    .merge(self.terms, on='term_uri', how='inner')
        dept_data = self.department_terms[ \
                    self.department_terms['term_uri'].isin(parts['term_uri']) ] \
                    .merge(self.departments, on='dept_uri', how='inner') \
                    .groupby(['dept_uri','dept_label']).size().reset_index() \
                    .rename(columns={0:'count'}).to_dict('records') 
        part_data = parts.to_dict('records')
        return {
                'particle': particle, 'terms': part_data, 'departments': dept_data }

    def term_profile(self, term_id):
        term_data = self.terms[ self.terms['term_id'] == term_id ] \
                        .to_dict('records')[0]
        term_parts = self.particles[ \
                        self.particles['term_uri']  == term_data['term_uri'] ]
        depts_for_term = self.department_terms[ \
                            self.department_terms['term_uri'] \
                                == term_data['term_uri'] ]
        depts = self.departments[ self.departments['dept_uri'].isin( \
                    depts_for_term['dept_uri']) ]
        coterms = self.term_pairs[ self.term_pairs['term_uri'] == term_data['term_uri'] ]
        coparts = coterms.merge(self.particles, \
                    left_on='coterm_uri', right_on='term_uri', how='inner')
        dept_totals = self.department_particles[ \
                        self.department_particles['dept_uri'] \
                        .isin(depts_for_term['dept_uri']) ]
        prts_by_dept = dept_totals.groupby('dept_uri')
        dept_groups = [ prts_by_dept.get_group(grp) for grp in prts_by_dept.groups ]
        # all_total = self.faculty_terms.merge( \
        #                 self.particles, on='term_uri', how='inner') \
        #                 .groupby('particle').size().reset_index()
        # all_mean = all_total[0].mean()
        out = []
        for grp in dept_groups:
            scores = grp.groupby('particle').size().reset_index()
            dept_mean = scores[0].mean()
            scores['z'] = scores[0].apply( \
                            lambda x: (x - dept_mean) / scores[0].std())
            part_scores = scores[ scores['particle'].isin(term_parts['particle']) ].to_dict('records')
            out.append({'dept_uri': grp['dept_uri'].unique()[0],
                        'scores': part_scores })
        return out

    def parse_term(self, term_id):
        term_data = self.terms[ self.terms['term_id'] == term_id ] \
                        .to_dict('records')[0]
        term_parts = self.particles[ \
                        self.particles['term_uri']  == term_data['term_uri'] ]
        depts_for_term = self.department_terms[ \
                            self.department_terms['term_uri'] \
                                == term_data['term_uri'] ]
        depts = self.departments[ self.departments['dept_uri'].isin( \
                    depts_for_term['dept_uri']) ]
        scores = [ self.profile_dept(d) for d in depts['dept_id'].values ]
        total = pd.concat(scores, ignore_index=True)
        data = total[ total['particle'].isin(term_parts['particle'].values)]
        return data

    def profile_dept(self, dept_id):
        dept_data = self.departments[ self.departments['dept_id'] == dept_id ] \
                        .to_dict('records')[0]
        dept_parts = self.department_particles[ \
                        self.department_particles['dept_uri'] \
                            == dept_data['dept_uri'] ]
        counts = dept_parts.groupby('particle').size().reset_index()
        profile = dept_parts.merge(counts, on='particle', how='inner') \
                    .rename(columns={0:'count'}) \
                    .drop('term_uri',1) \
                    .drop_duplicates()
        dept_mean = profile['count'].mean()
        profile['z'] = profile['count'].apply( \
                            lambda x: (x - dept_mean) / profile['count'].std())
        return profile

    def jaccard(self, term_id):
        term_data = self.terms[ self.terms['term_id'] == term_id ] \
                        .to_dict('records')[0]
        coterms = self.term_pairs[ self.term_pairs['term_uri'] \
                    == term_data['term_uri'] ]['coterm_uri'].values
        term_bag = self.particles[ self.particles['term_uri'].isin(coterms) ]
        term_set = set(term_bag['particle'])

        term_parts = self.particles[ \
                self.particles['term_uri']  == term_data['term_uri'] ] \
                ['particle'].values
        out = {}
        for part in term_parts:
            terms_with_part = self.particles \
                        [ self.particles['particle'] == part ]['term_uri'].values
            without_orig = np.delete(
                    terms_with_part, np.argwhere(
                        terms_with_part==term_data[ 'term_uri' ] ) )
            for part_term in terms_with_part:
                copterms = self.term_pairs[ self.term_pairs['term_uri'] \
                                == part_term ]['coterm_uri'].values
                copterm_bag = self.particles[ self.particles['term_uri'].isin(copterms) ]
                copterm_set = set(copterm_bag['particle'])
                out[ self.terms[ self.terms['term_uri'] == part_term ] \
                    .term_label.values[0] ] \
                    = float( len(term_set & copterm_set) ) / len(term_set | copterm_set)
        return out

    def context(self, term_id):
        term_data = self.terms[ self.terms['term_id'] == term_id ] \
                    .to_dict('records')[0]
        depts = self.department_terms[ self.department_terms['term_uri'] \
                    == term_data['term_uri'] ][ 'dept_uri' ].values
        parts = self.particles[ \
                    self.particles['term_uri']  == term_data['term_uri'] ] \
                    ['particle'].values
        out = {}
        for dept in depts:
            dept_parts = self.department_particles[ \
                    self.department_particles[ 'dept_uri' ] == dept ]
            fac_freq = self.faculty_departments[ \
                    self.faculty_departments['dept_uri'] == dept ] \
                    .merge(self.faculty_terms, on='fac_uri', how='inner') \
                    .merge(self.particles, on='term_uri', how='inner') \
                    .drop('term_uri', 1) \
                    .drop('dept_uri', 1) \
                    .drop_duplicates() \
                    .groupby('particle').size().reset_index()
            print fac_freq[0].sort_values()
            counts = dept_parts.groupby('particle').size().reset_index() \
                        .merge(fac_freq, on='particle', how='inner')
            counts.columns = ['particle', 'part_count', 'fac_freq']
            counts['s'] = counts.apply(
                            lambda x: \
                                float(1) * x.fac_freq / len(counts),
                                axis=1 )
            out[dept] = { part: counts[ counts['particle'] == part ].s.values[0] 
                            for part in parts }
        return out

    def corr(self, term_uri):
        depts = self.department_terms[ self.department_terms['term_uri'] \
                    == term_uri ][ 'dept_uri' ].values
        parts = self.particles[ \
                    self.particles['term_uri']  == term_uri ] \
                    ['particle'].values
        out = { 'major': [], 'minor':[] }
        for part in parts:
            sharing_part = self.particles[ \
                            self.particles['particle'] == part ]
            term_count = len(sharing_part)
            coparts = self.particle_pairs[ \
                        self.particle_pairs['particle'] == part ]
            total_coparts = len(coparts)
            dept_total = 0
            # part_total = self.department_particles.groupby('particle') \
            #                 .get_group(part).size()
            for dept in depts:
                dept_parts = self.department_particles[ \
                                self.department_particles['dept_uri'] == dept ]
                dept_terms = dept_parts[ dept_parts['term_uri'] \
                                .isin(sharing_part['term_uri'].values) ]
                grpd = dept_terms.groupby('particle')
                dept_count = len(grpd)
                dept_part_count = len(grpd.get_group(part))
                # print "dept_count: ", dept_count
                if dept_part_count > dept_total:
                    dept_total = dept_part_count
            # dept_diff = total_coparts - dept_total
            # print "dept_diff: ", dept_diff, '\n'
            score = (float(term_count) / total_coparts) * dept_total
            if score < 1:
                out['minor'].append(part)
            else:
                out['major'].append(part)
        return out