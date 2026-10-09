from pathlib import Path
import json,re,hashlib
D=Path(__file__).resolve().parent
p=D/'manuscript-r1.md';s=p.read_text(encoding='utf8');changes=[]
def replace(old,new):
    global s
    assert s.count(old)==1,(old[:80],s.count(old))
    s=s.replace(old,new);changes.append({'old':old,'new':new})
replace('Three different promises about nearby starts','Four different promises about nearby starts')
replace('They were run with Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1.', 'The eleven original programmes were run with Python 3.12.14, NumPy 2.3.5 and SciPy 1.18.1. The added vector RK4 and practice programmes were run with Python 3.12.8 and use only its standard library.')
replace('Select the actual r=3.83 grid column to see the window; a nearby column must not be relabeled as 3.83.', 'Select r=3.83 to see a sampled column in the period-three window; its label identifies the parameter actually used.')
replace('Label the halves L and R in addition to their different colours.', 'The L and R labels identify the halves as well as their different colours.')
replace('[[D38]]', 'Zoom into the itinerary interval and locate the point that repeats the same word.\n\n[[D38]]')
replace('The magnification is labeled; a two-pixel sliver must not become an apparently unchanged interval.', 'The magnification label lets you compare the local detail with the shrinking interval on the full ruler.')
replace('These dense periodic points coexist with sensitive dependence; they do not mean that every orbit is periodic.', 'The same covering argument explains sensitive dependence. Any arbitrarily small starting neighborhood contains a cylinder whose image is the entire unit interval after n steps. At that time choose an image endpoint at least 1/2 away from the reference image; its preimage is a nearby start that has separated. The fixed separation scale can therefore be reached from arbitrarily close starts. The dense periodic points do not mean that every orbit is periodic.')
replace('The surrounding prose carries that interpretation instead of printing an explanatory sentence from the program.', 'That short-time agreement answers a narrower question than long-term forecast accuracy.')
replace('[[D52]]', 'Now compare the shape of the original energy level with the one preserved by the update.\n\n[[D52]]')
replace('The printed growing Euler energy and bounded symplectic oscillation therefore test the mechanisms just drawn, without treating either method as an exact physical path.', 'The printed endpoint energies are consistent with the mechanisms just drawn. The time plots, rather than the endpoint list alone, reveal the symplectic energy oscillation; neither method gives an exact physical path.')
replace('**Check the distinction.** The symplectic run reports modified energy 0.5 at every step.', '**Check the distinction.** The browser’s symplectic trace reports modified energy 0.5 at every step.')
replace('The original eleven source/output pairs are preserved; nine purely explanatory print lines have moved into the surrounding prose. Numerical assertions, errors and all scientific output remain intact. The two added complete programmes have their own recorded executions.', 'The recorded outputs use the declared mathematical fixtures and execution environments. Numerical assertions and input errors remain part of the complete runnable examples.')
replace('Each file has full source and recorded output at its teaching point. Runtime implementation must provide exact Copy, Download and output delivery using these prepared bytes; the final index links to those same assets. The downloadable output is an observation from the stated fixture, not a substitute for the mechanism or its assumptions.', 'Each file has full source and recorded output at its teaching point. Use its source to change a fixture yourself; the recorded output describes the stated run and its assumptions.')
# Whole sources remain byte-for-byte included; links point to real prepared files for review.
names=re.findall(r'\*\*Complete file: `([^`]+)`\*\*',s)
for name in names:
    s=s.replace(f'**Complete file: `{name}`**',f'**Complete file: [{name}](content-prepared/programmes/{name})**')
    s=s.replace(f'| `{name}` |',f'| [{name}](content-prepared/programmes/{name}) |')
anchors=[]
for m in list(re.finditer(r'^## (\d+)\. (.+)$',s,re.M)):
    title=m.group(2);anchor=re.sub(r'[^a-z0-9]+','-',title.lower()).strip('-')
    anchors.append({'number':int(m.group(1)),'title':title,'anchor':anchor})
assert len(anchors)==11
index='Follow the lesson in order, or return to a specific mechanism:\n\n'+'\n'.join(f"{a['number']}. [{a['title']}](#{a['anchor']})" for a in anchors)+'\n\n'
first='## 1. Choose a state and a clock';s=s.replace(first,index+first,1)
for a in anchors:
    heading=f"## {a['number']}. {a['title']}"
    s=s.replace(heading,f'<a id="{a["anchor"]}"></a>\n\n'+heading,1)
p.write_text(s,encoding='utf8')
(D/'content-reader-structure-r1.json').write_text(json.dumps({'anchors':anchors,'files':names,'readingRefinements':changes},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
# Match the retained planar fields rather than substituting a different valid example.
p=D/'visual-specifications-r1.md';v=p.read_text(encoding='utf8')
old='Center(-p,q), spiral(-q−p,q−p), saddle(q,−p), start(1,0) default;'
new='Center (−p,q), spiral (−.4q−p,q−.4p), saddle (.4q,−.5p), start (1,0) by default;'
assert v.count(old)==1;v=v.replace(old,new)
v+='\n**Content link projection.** The manuscript’s relative programme links resolve to the real prepared source files during review. Runtime must map these 13 links to the source-matching topic assets, without changing filenames or full bodies. Its explicit HTML anchor declarations record the existing shared section IDs; use those IDs in the shared introduction and headings.\n'
p.write_text(v,encoding='utf8')
p=D/'content-drawing-contracts-r1.json';rows=json.loads(p.read_text(encoding='utf8'));rows[17]['construction']=rows[17]['construction'].replace(old,new);p.write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'readerRefinements':len(changes),'anchors':len(anchors),'programmeLinks':len(names),'manuscriptBytes':len(s.encode()),'specBytes':len(v.encode())}))
