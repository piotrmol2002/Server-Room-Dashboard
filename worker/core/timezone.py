from datetime import datetime
import pytz

TIMEZONE = pytz.timezone('Europe/Warsaw')


def now_warsaw():
    return datetime.now(TIMEZONE)


def to_warsaw(dt: datetime):
    if dt.tzinfo is None:
        dt = pytz.utc.localize(dt)
    return dt.astimezone(TIMEZONE)
