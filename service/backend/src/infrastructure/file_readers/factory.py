from .csv_reader import CSVReader
# from .xlsx_reader import XLSXReader

def get_reader(filename: str):
    if filename.endswith(".csv"):
        return CSVReader()
    # if filename.endswith(".xlsx"):
    #     return XLSXReader()

    raise ValueError("Unsupported file format")
