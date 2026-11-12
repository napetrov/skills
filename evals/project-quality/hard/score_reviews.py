#!/usr/bin/env python3
"""Import blinded reviewer decisions into Dokimi; these remain agent-judged scores."""
import argparse,json,re,subprocess
from pathlib import Path
HERE=Path(__file__).resolve().parent
p=argparse.ArgumentParser();p.add_argument('--work',type=Path,required=True);p.add_argument('--dokimi-root',type=Path,required=True);p.add_argument('--python',required=True);a=p.parse_args()
work=a.work.resolve();rubrics=json.loads((HERE/'rubric.json').read_text());mapping=json.loads((work/'review-map.json').read_text())
summary={'score_kind':'agent-judged criteria, deterministically aggregated by Dokimi; not executable oracle scores','reviewers':{},'disagreements':[]}
all_reviews=[]
for reviewer in ['reviewer1','reviewer2']:
 data=json.loads((work/f'{reviewer}.json').read_text());rows={r['id']:r for r in data['reports']}
 assert len(rows)==len(data['reports'])==len(mapping),'missing or duplicate report'
 outcomes={};questions=[];answers=[];controls=[]
 for rid,meta in mapping.items():
  r=rows[rid];expected=set(rubrics[meta['task']]['required']);assert set(r['criteria'])==expected
  assert all(type(v['met']) is bool and isinstance(v['evidence'],str) for v in r['criteria'].values())
  met=sum(v['met'] for v in r['criteria'].values());false=r['critical_false_claims']
  outcomes[rid]={'met':met,'total':len(expected),'critical_false_claims':false,**meta}
  if meta['control']:
   good=meta['arm']=='good'
   controls.append({'id':rid,'kind':meta['arm'],'calibrated':met==(6 if good else 0) and (not false if good else bool(false)),'met':met,'critical_false_claims':false})
 for task in rubrics:
  keys=list(rubrics[task]['required'])
  questions.append({'id':task,'question':'Assess '+task,'grading':{'checks':[{'type':'regex','values':['"'+re.escape(k)+'"\\s*:\\s*true']} for k in keys]}})
  row={'question_id':task,'question_text':'Assess '+task}
  for arm in ['with_docs','without_docs']:
   rid=next(k for k,v in mapping.items() if not v['control'] and v['task']==task and v['arm']==arm)
   row[arm]={'answer':json.dumps({k:rows[rid]['criteria'][k]['met'] for k in keys})}
  answers.append(row)
 qp=work/f'{reviewer}-questions.json';ap=work/f'{reviewer}-answers.json';op=work/f'{reviewer}-dokimi.json'
 qp.write_text(json.dumps({'schema_version':'questions.v2','questions':questions},indent=2));ap.write_text(json.dumps({'schema_version':'answers.v1','model':None,'provider':None,'answers':answers},indent=2))
 command=[a.python,str(a.dokimi_root.resolve()/'dokimi/cli.py'),'eval','score','reference','--answers',str(ap),'--questions',str(qp),'--no-judge','-o',str(op)]
 result=subprocess.run(command,capture_output=True,text=True,timeout=120)
 assert result.returncode==0,result.stderr
 summary['reviewers'][reviewer]={'reports':outcomes,'calibration':controls,'dokimi':json.loads(op.read_text())['run_metadata']['summary'],'command':command}
 all_reviews.append(rows)
for rid,meta in mapping.items():
 for key in rubrics[meta['task']]['required']:
  if all_reviews[0][rid]['criteria'][key]['met'] != all_reviews[1][rid]['criteria'][key]['met']:
   summary['disagreements'].append({'id':rid,'criterion':key,**meta})
(work/'review-summary.json').write_text(json.dumps(summary,indent=2)+'\n')
print(json.dumps({k:{'calibrated':sum(c['calibrated'] for c in v['calibration']),'controls':len(v['calibration']),'dokimi':v['dokimi']} for k,v in summary['reviewers'].items()},indent=2))
print('disagreements',len(summary['disagreements']))
