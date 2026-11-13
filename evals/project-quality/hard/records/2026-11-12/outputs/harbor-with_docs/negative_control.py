import sys,unittest
sys.dont_write_bytecode=True
sys.path.insert(0,'/workspace/scratch/c0a9fdcf5a68/quality-hard/harbor-with_docs')
import rules
rules.compatible=lambda old,new: True
suite=unittest.defaultTestLoader.discover('/workspace/scratch/c0a9fdcf5a68/quality-hard/harbor-with_docs/tests')
result=unittest.TextTestRunner(verbosity=2).run(suite)
from cli import dashboard
print('always_true_mutant',dashboard(),'tests_passed',result.wasSuccessful())
