from __future__ import annotations

from importlib import import_module
from io import BytesIO

from src.application.errors import ValidationError
from src.application.ports.media_storage import MediaStorageProvider, MediaUploadResult
from src.config import get_settings


class CloudinaryMediaStorageProvider(MediaStorageProvider):
    def __init__(self, folder: str | None = None) -> None:
        settings = get_settings()
        self.cloud_name = settings.cloudinary_cloud_name
        self.api_key = settings.cloudinary_api_key
        self.api_secret = settings.cloudinary_api_secret
        self.default_folder = folder or settings.cloudinary_folder

    def upload_image(
        self,
        *,
        file_bytes: bytes,
        filename: str,
        folder: str | None = None,
    ) -> MediaUploadResult:
        uploader = self._get_uploader_module()
        stream = BytesIO(file_bytes)
        stream.name = filename

        result = uploader.upload(
            stream,
            resource_type="image",
            folder=folder or self.default_folder,
            use_filename=True,
            unique_filename=True,
            overwrite=False,
        )

        return MediaUploadResult(
            provider="CLOUDINARY",
            resource_type=result.get("resource_type", "image"),
            public_id=result["public_id"],
            secure_url=result["secure_url"],
            bytes=int(result.get("bytes", 0)),
            format=result.get("format", ""),
            width=result.get("width"),
            height=result.get("height"),
            original_filename=filename,
        )

    def delete_asset(self, public_id: str) -> None:
        uploader = self._get_uploader_module()
        uploader.destroy(public_id, resource_type="image", invalidate=True)

    def _get_uploader_module(self):
        if not self.cloud_name or not self.api_key or not self.api_secret:
            raise ValidationError("Cloudinary credentials are not configured")

        cloudinary = import_module("cloudinary")
        cloudinary.config(
            cloud_name=self.cloud_name,
            api_key=self.api_key,
            api_secret=self.api_secret,
            secure=True,
        )
        return import_module("cloudinary.uploader")
