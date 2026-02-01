from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
from os import environ


load_dotenv()
oauth = OAuth()

google = oauth.register(
    name="google",
    client_id=environ.get("CLIENT_ID"),
    client_secret=environ.get("CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={'scope': "openid profile email"}
    
)

facebook = oauth.register(
    name="facebook",
    client_id=environ.get("APP_ID"),
    client_secret=environ.get("APP_SECRET"),
    access_token_url="https://graph.facebook.com/v20.0/oauth/access_token",
    authorize_url="https://www.facebook.com/v20.0/dialog/oauth",
    api_base_url="https://graph.facebook.com/v20.0/",
    client_kwargs={'scope': "email public_profile"}
)