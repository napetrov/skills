#!/usr/bin/env python3
"""Prepare randomized report packets; keep the arm mapping away from reviewers."""
import argparse,json,random,re
from pathlib import Path
HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('work',type=Path);a=p.parse_args();work=a.work.resolve()
items=[]
for task in ['cedar','harbor','quartz']:
    for arm in ['without_docs','with_docs']:
        text=(work/'outputs'/f'{task}-{arm}'/'report.md').read_text()
        text=re.sub(re.escape(str(work))+r'/[^\s`\)]+','<local-artifact>',text)
        text=text.replace('without_docs','condition').replace('with_docs','condition')
        items.append((task,arm,False,text))
for name,text in json.loads((HERE/'calibration.json').read_text()).items():
    task,kind=name.split('-');items.append((task,kind,True,text))
random.Random(917).shuffle(items)
reports=[];mapping={}
for i,(task,arm,control,text) in enumerate(items):
    rid=f'r{i+1:02d}';reports.append({'id':rid,'task':task,'report':text})
    mapping[rid]={'task':task,'arm':arm,'control':control}
(work/'review-packet.json').write_text(json.dumps({'rubrics':json.loads((HERE/'rubric.json').read_text()),'reports':reports},indent=2)+'\n')
(work/'review-map.json').write_text(json.dumps(mapping,indent=2)+'\n')
print('Give reviewers only review-packet.json, never review-map.json.')
