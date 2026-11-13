#!/usr/bin/env python3
"""Prepare hard development cases without copying rubrics into agent workspaces."""
from pathlib import Path
import argparse,json,shutil,subprocess,hashlib
HERE=Path(__file__).resolve().parent
REPO=HERE.parents[2]
p=argparse.ArgumentParser();p.add_argument("output",type=Path);a=p.parse_args()
if a.output.exists():p.error("output already exists")
a.output.mkdir(parents=True)
shutil.copytree(REPO/"skills/assess-project-quality",a.output/"skill")
manifest=[]
for name in ["cedar","harbor","quartz"]:
 for arm in ["without_docs","with_docs"]:
  target=a.output/f"{name}-{arm}";shutil.copytree(HERE/"fixtures"/name,target)
  (target/"TASK.md").write_text((HERE/"task.txt").read_text())
  for cmd in [["git","init","-q"],["git","add","."],["git","-c","user.name=experiment","-c","user.email=experiment@example.invalid","commit","-qm","Frozen hard task"]]:
   subprocess.run(cmd,cwd=target,check=True)
  out=a.output/"outputs"/f"{name}-{arm}"
  prefix=(f"Read {a.output/'skill/SKILL.md'} and its references. " if arm=="with_docs" else "Do not load skills. ")
  manifest.append({"task":name,"arm":arm,"prompt":prefix+f"Read only {target}, follow TASK.md, write report.md to {out}. Do not inspect sibling tasks, rubrics or outputs. No network or target changes."})
(a.output/"manifest.json").write_text(json.dumps(manifest,indent=2)+'\n')
(a.output/"freeze.json").write_text(json.dumps({str(x.relative_to(HERE)):hashlib.sha256(x.read_bytes()).hexdigest() for x in HERE.rglob('*') if x.is_file() and '__pycache__' not in x.parts},indent=2)+'\n')
print(a.output)
