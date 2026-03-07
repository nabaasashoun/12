from django.apps import AppConfig


class TrendsyncConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'trendsync'
    
    def ready(self):
        import trendsync.signals