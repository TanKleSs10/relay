from abc import ABC, abstractmethod

class BaseFileReader(ABC):

    @abstractmethod
    def read(self, file) -> list[dict]:
        pass
