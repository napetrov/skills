#!/usr/bin/env python3
"""Confirm the focused caller-guard fixtures using independent public-API assertions."""
from pathlib import Path
import subprocess,sys,json
root=Path(__file__).resolve().parent
code='''from service import JobService
s=JobService();old=s.claim("w",0);new=s.claim("w",11)
accepted=s.publish(old,"stale")
assert not accepted,(accepted,s._store.row)
assert s.publish(new,"fresh")
assert s._store.row["value"]=="fresh"
assert not s.publish(new,"duplicate")
'''
results={}
for variant in ['a','b']:
 p=subprocess.run([sys.executable,'-B','-c',code],cwd=root/'fixtures'/variant,text=True,capture_output=True,timeout=10)
 results[variant]={'exit':p.returncode,'stderr':p.stderr}
assert results['a']['exit']==0 and results['b']['exit']!=0
print(json.dumps(results,indent=2))
