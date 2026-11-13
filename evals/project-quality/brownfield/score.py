#!/usr/bin/env python3
"""Import externally generated reports into real Dokimi deterministic scoring."""
import argparse,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--answers',type=Path,required=True);p.add_argument('--out',type=Path,required=True);p.add_argument('--python',required=True);p.add_argument('--dokimi',type=Path,required=True);a=p.parse_args()
a.out.mkdir(parents=True,exist_ok=True)
expected={k:False for k in ['zero_change_is_regression','differential_pass_proves_contract','tests_preserve_assertions','default_activates_modern','fallback_presence_is_defect','ready_to_release']}
q={'id':'migration','question':'Assess migration readiness using the target README contract.','grading':{'checks':[{'type':'json','values':[expected]}]}}
row={'question_id':'migration','question_text':q['question']}
for arm,folder in [('with_docs','skill'),('without_docs','baseline')]:
 row[arm]={'answer':(a.answers/folder/'verdicts.json').read_text()}
for name,data in [('questions',{'schema_version':'questions.v2','questions':[q]}),('answers',{'schema_version':'answers.v1','model':None,'provider':None,'answers':[row],'total_questions':1})]:
 (a.out/(name+'.json')).write_text(json.dumps(data,indent=2)+'\n')
cmd=[a.python,str(a.dokimi/'dokimi/cli.py'),'eval','score','reference','--answers',str(a.out/'answers.json'),'--questions',str(a.out/'questions.json'),'--no-judge','-o',str(a.out/'score.json')]
r=subprocess.run(cmd,capture_output=True,text=True)
(a.out/'execution.json').write_text(json.dumps({'command':cmd,'exit_code':r.returncode,'stdout':r.stdout,'stderr':r.stderr},indent=2)+'\n')
raise SystemExit(r.returncode)
