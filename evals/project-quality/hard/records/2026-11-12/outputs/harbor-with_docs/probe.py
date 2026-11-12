import sys, itertools, json, struct, platform, time, subprocess, os
from pathlib import Path
root=Path('/workspace/scratch/c0a9fdcf5a68/quality-hard/harbor-with_docs')
sys.dont_write_bytecode=True
sys.path.insert(0,str(root))
from codec import encode,decode
from rules import compatible
from generate import layouts,corpus
start=time.perf_counter()
print('environment',sys.version,platform.platform(),'byteorder',sys.byteorder)
env=dict(os.environ,PYTHONDONTWRITEBYTECODE='1')
for command in [[sys.executable,'-m','unittest','discover','-s','tests','-v'],[sys.executable,'cli.py']]:
 r=subprocess.run(command,cwd=root,env=env,capture_output=True,text=True)
 print('command',command,'exit',r.returncode,'stdout',r.stdout,'stderr',r.stderr)
values=[-2**31,-1,0,1,2**31-1]
pairs=list(itertools.product(list(layouts()),repeat=2))
counts=dict(pairs=len(pairs),generated=len(corpus()),executed_values=0,predicted_compatible=0,false_positive_pairs=0,false_negative_pairs=0,consumer_success=0,consumer_wrong=0,consumer_error=0)
for old,new in pairs:
 ok=True
 for a,b in itertools.product(values,repeat=2):
  v={'a':a,'b':b}; counts['executed_values']+=1
  try:
   actual=decode(old,encode(new,v)); same=actual==v
   counts['consumer_success' if same else 'consumer_wrong']+=1
  except struct.error:
   same=False; counts['consumer_error']+=1
  ok=ok and same
 prediction=compatible(old,new)
 counts['predicted_compatible']+=prediction
 counts['false_positive_pairs']+=prediction and not ok
 counts['false_negative_pairs']+=not prediction and ok
print('counts',json.dumps(counts))
for old,new,v in [([('a',4),('b',4)],[('b',4),('a',4)],{'a':7,'b':11}),([('a',4),('b',8)],[('a',8),('b',4)],{'a':7,'b':11}),([('a',4),('b',4)],[('a',8),('b',4)],{'a':7,'b':11})]:
 try: actual=decode(old,encode(new,v))
 except struct.error as e: actual=str(e)
 print('example',old,new,v,'compatible',compatible(old,new),'actual',actual)
print('elapsed_seconds',time.perf_counter()-start)
