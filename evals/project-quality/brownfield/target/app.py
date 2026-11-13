import os
from engines import classic, modern
ENGINES = {"classic": classic, "modern": modern}
def quote(n):
    return ENGINES[os.getenv("ENGINE", "classic")](n)
