from celery import Celery
import os

REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379')

celery_app = Celery(
    'serwerownia_worker',
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=['tasks.background_jobs']
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='Europe/Warsaw',
    enable_utc=True,
)

if __name__ == '__main__':
    celery_app.start()
