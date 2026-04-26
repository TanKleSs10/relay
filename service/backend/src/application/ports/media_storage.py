from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(slots=True)
class MediaUploadResult:
    provider: str
    resource_type: str
    public_id: str
    secure_url: str
    bytes: int
    format: str
    width: int | None = None
    height: int | None = None
    original_filename: str | None = None


class MediaStorageProvider(Protocol):
    def upload_image(
        self,
        *,
        file_bytes: bytes,
        filename: str,
        folder: str | None = None,
    ) -> MediaUploadResult: ...

    def delete_asset(self, public_id: str) -> None: ...
