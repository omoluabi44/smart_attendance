

from os import environ
from api.v1.app import app


if __name__ == "__main__":
  
    host = environ.get('BDYM_API_HOST', '0.0.0.0')
    port = int(environ.get('BDYM_API_PORT', 5000))
    app.run(host=host, port=port, debug=True)