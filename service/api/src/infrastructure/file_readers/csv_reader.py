import csv
import io
from .base import BaseFileReader

class CSVReader(BaseFileReader):

    def read(self, file):
        content = file.file.read().decode("utf-8")
        reader = csv.DictReader(io.StringIO(content))
        return list(reader)