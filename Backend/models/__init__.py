#!/usr/bin/python3
"""
initialize the models package
"""

from os import getenv
from dotenv import load_dotenv
load_dotenv()

storage_t = getenv("BDYM_TYPE_STORAGE")

if storage_t == "db":
    from models.engine.db_storage import DBStorage
    storage = DBStorage()
else:
    from models.engine.file_storage import FileStorage
    storage = FileStorage()
storage.reload()
