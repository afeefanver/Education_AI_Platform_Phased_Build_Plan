import os
import sys

# Ensure api-gateway and shared-models are importable when running pytest from repo root.
_gateway_dir = os.path.dirname(__file__)
sys.path.insert(0, _gateway_dir)
sys.path.insert(0, os.path.abspath(os.path.join(_gateway_dir, "../../packages/shared-models/src")))
