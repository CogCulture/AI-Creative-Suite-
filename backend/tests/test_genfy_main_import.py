import importlib
import sys
from pathlib import Path


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def test_genfy_main_imports_without_jwt_module_error():
    module = importlib.import_module("genfy_main")
    assert hasattr(module, "app")
