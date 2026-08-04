import os
import sys

_service_dir = os.path.dirname(__file__)
sys.path.insert(0, _service_dir)
sys.path.insert(0, os.path.abspath(os.path.join(_service_dir, "../../packages/shared-models/src")))
