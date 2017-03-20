import os
import sys

path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

activate_this = os.path.join(path, 'venv/bin/activate_this.py')
execfile(activate_this, dict(__file__=activate_this))

if path not in sys.path:
  sys.path.append(path)

from run import app as application
