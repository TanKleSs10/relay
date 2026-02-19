from __future__ import annotations


class AppError(Exception):
    """Base class for application-level errors."""


class NotFoundError(AppError):
    """Requested resource was not found."""


class ConflictError(AppError):
    """Requested operation conflicts with existing state."""


class ValidationError(AppError):
    """Requested operation is invalid given the input."""
