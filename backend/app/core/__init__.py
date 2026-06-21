from app.core.cache import cache

try:
    from app.core.monitoring import setup_monitoring
except ImportError:
    def setup_monitoring(app):
        pass
