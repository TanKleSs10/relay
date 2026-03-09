import csv
import io
from .base import BaseFileReader

class CSVReader(BaseFileReader):

    def read(self, file):
        raw = file.file.read()
        content = None
        for encoding in ("utf-8-sig", "utf-8", "latin-1"):
            try:
                content = raw.decode(encoding)
                break
            except UnicodeDecodeError:
                continue
        if content is None:
            raise UnicodeDecodeError("utf-8", raw, 0, 1, "Invalid CSV encoding")
        reader = csv.DictReader(io.StringIO(content))
        return list(reader)
