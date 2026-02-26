from __future__ import annotations

from sqlalchemy.orm import Session

from src.domain import SendRule, Provider


def create_send_rule(
    db: Session,
    provider: Provider,
    min_delay_seconds: int,
    max_delay_seconds: int,
    max_messages_per_hour: int,
    max_messages_per_day: int,
    cooldown_minutes: int,
    active: bool = True,
) -> SendRule:
    send_rule = SendRule(
        provider=provider,
        min_delay_seconds=min_delay_seconds,
        max_delay_seconds=max_delay_seconds,
        max_messages_per_hour=max_messages_per_hour,
        max_messages_per_day=max_messages_per_day,
        cooldown_minutes=cooldown_minutes,
        active=active,
    )
    db.add(send_rule)
    db.commit()
    db.refresh(send_rule)
    return send_rule


def get_send_rule_by_id(db: Session, send_rule_id: int) -> SendRule | None:
    return db.query(SendRule).filter(SendRule.id == send_rule_id).first()


def get_active_send_rule(db: Session, provider: Provider) -> SendRule | None:
    return (
        db.query(SendRule)
        .filter(SendRule.provider == provider, SendRule.active == True)
        .order_by(SendRule.id)
        .first()
    )


def list_send_rules(db: Session, skip: int = 0, limit: int = 100) -> list[SendRule]:
    return (
        db.query(SendRule)
        .order_by(SendRule.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_send_rules_by_provider(
    db: Session, provider: Provider, skip: int = 0, limit: int = 100
) -> list[SendRule]:
    return (
        db.query(SendRule)
        .filter(SendRule.provider == provider)
        .order_by(SendRule.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_send_rule(db: Session, send_rule: SendRule, **kwargs) -> SendRule:
    for field, value in kwargs.items():
        if hasattr(send_rule, field) and value is not None:
            setattr(send_rule, field, value)
    db.commit()
    db.refresh(send_rule)
    return send_rule


def delete_send_rule(db: Session, send_rule: SendRule) -> None:
    db.delete(send_rule)
    db.commit()
