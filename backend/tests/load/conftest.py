"""Load test configuration.

Skips integration/load tests that require a running backend server.
"""
import pytest
import socket


def is_backend_running(host="localhost", port=8000):
    try:
        with socket.create_connection((host, port), timeout=1):
            return True
    except (socket.timeout, ConnectionRefusedError, OSError):
        return False


loadtest = pytest.mark.skipif(
    not is_backend_running(),
    reason="Backend server not running on localhost:8000",
)
