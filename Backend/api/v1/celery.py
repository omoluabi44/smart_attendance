from celery import Celery
import os


def create_celery_app():
    redis_url = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
    celery_app = Celery(
        "api.v1",
        broker=redis_url,
        backend=redis_url,
        include=["api.v1.utils.webhook_dispatcher"],
    )

    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        broker_connection_retry_on_startup=True,
    )

    class ContextTask(celery_app.Task):
        def __call__(self, *args, **kwargs):
            from api.v1.app import app

            with app.app_context():
                return self.run(*args, **kwargs)

    celery_app.Task = ContextTask
    return celery_app


celery = create_celery_app()
