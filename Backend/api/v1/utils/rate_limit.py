from datetime import datetime, timedelta
from flask import jsonify, make_response
from models import storage  

def check_daily_rate_limit(user, limit=5, window_hours=24):
    """
    Checks if a user has hit their daily limit.
    Returns None if allowed, or a 429 Response if blocked.
    """
    now = datetime.utcnow()
    if not user.daily_limit_start or (now - user.daily_limit_start) > timedelta(hours=window_hours):
        user.daily_limit_start = now
        user.daily_request_count = 0
        storage.save()
    
    if user.daily_request_count >= limit:
        reset_time = user.daily_limit_start + timedelta(hours=window_hours)
        remaining_time = reset_time - now
        hours, remainder = divmod(remaining_time.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        return make_response(jsonify({
            "error": f"Daily limit reached. Limit resets in {hours}h {minutes}m."
        }), 429)

    return None