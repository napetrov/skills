#!/usr/bin/env python3
"""Verify task facts and contrast controls independently of report grading."""
import json,subprocess,sys,tempfile,shutil
from pathlib import Path
HERE=Path(__file__).resolve().parent
results={}

def run(root,code):
    r=subprocess.run([sys.executable,'-B','-c',code],cwd=root,text=True,capture_output=True,timeout=20)
    return {'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr}

for name in ['cedar','harbor','quartz']:
    r=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s','tests','-v'],cwd=HERE/'fixtures'/name,capture_output=True,text=True,timeout=20)
    assert r.returncode==0,(name,r.stderr)
    results[name]={'visible_suite_exit':r.returncode,'visible_suite':r.stderr}
code='''from store import Store
s=Store();old=s.claim("worker",0);new=s.claim("worker",11)
assert s.complete(new,"fresh")
accepted=s.complete(old,"stale")
assert not accepted and s.row["result"]=="fresh", (accepted,s.row)
'''
results['cedar']['lease_witness']=run(HERE/'fixtures/cedar',code)
assert results['cedar']['lease_witness']['exit']!=0
metric='''from report import summarize
r=summarize([{"status":"ok","mentioned":True},{"status":"timeout","mentioned":False}])
assert r=={"visibility":1.0,"coverage":0.5},r
'''
results['cedar']['metric_witness']=run(HERE/'fixtures/cedar',metric)
assert results['cedar']['metric_witness']['exit']!=0
consumer='''from rules import compatible
from codec import encode,decode
old=[("a",4),("b",8)];new=[("a",8),("b",4)];values={"a":7,"b":11}
observed=decode(old,encode(new,values))
print({"compatible":compatible(old,new),"observed":observed,"expected":values})
assert not compatible(old,new) or observed==values
'''
results['harbor']['consumer_witness']=run(HERE/'fixtures/harbor',consumer)
assert results['harbor']['consumer_witness']['exit']!=0
r=run(HERE/'fixtures/harbor','from generate import layouts,corpus; assert len(list(layouts()))==8; assert len(corpus())==9; print("8 layouts,64 pairs,9 emitted")')
assert r['exit']==0;results['harbor']['domain']=r
with tempfile.TemporaryDirectory() as tmp:
    tmp=Path(tmp)
    for name in ['cedar','harbor','quartz']:shutil.copytree(HERE/'fixtures'/name,tmp/name)
    p=tmp/'cedar/store.py';p.write_text(p.read_text().replace('if lease.worker != self.row["worker"]:','if lease.worker != self.row["worker"] or lease.epoch != self.row["epoch"]:'))
    assert run(tmp/'cedar',code)['exit']==0
    p=tmp/'cedar/report.py';p.write_text(p.read_text().replace('return {"visibility": mentions / len(records), "coverage": 1.0}','ok = sum(r["status"] == "ok" for r in records)\n    return {"visibility": mentions / ok if ok else None, "coverage": ok / len(records)}'))
    assert run(tmp/'cedar',metric)['exit']==0
    p=tmp/'harbor/rules.py';p.write_text(p.read_text().replace('return size(old) == size(new)','return old == new'))
    assert run(tmp/'harbor',consumer)['exit']==0
    p=tmp/'quartz/core.py';p.write_text(p.read_text().replace('return min(a + b, 31)','return (a + b) % 32'))
    r=subprocess.run([sys.executable,'-B','-m','unittest','discover','-s','tests'],cwd=tmp/'quartz',capture_output=True,text=True,timeout=20)
    assert r.returncode!=0
    results['quartz']['modulo_mutation_detected']=True
results['controls']={'lease_fix_rejects_stale':True,'metric_fix_meets_contract':True,'layout_fix_rejects_break':True,'quartz_mutation_detected':True}
print(json.dumps(results,indent=2))
