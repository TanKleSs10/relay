from __future__ import annotations

from sqlalchemy.orm import Session

from src.domain import SendRule


def create_send_rule(
    db: Session,
    messages_per_minute: int,
    delay_between_messages: int,
    active_senders: int,
    queue_size: int,
) -> SendRule:
    send_rule = SendRule(
        messages_per_minute=messages_per_minute,
        delay_between_messages=delay_between_messages,
        active_senders=active_senders,
        queue_size=queue_size,
    )
    db.add(send_rule)
    db.commit()
    db.refresh(send_rule)
    return send_rule


def get_send_rule_by_id(db: Session, send_rule_id: int) -> SendRule | None:
    return db.query(SendRule).filter(SendRule.id == send_rule_id).first()


def get_latest_send_rule(db: Session) -> SendRule | None:
    return db.query(SendRule).order_by(SendRule.id.desc()).first()


def list_send_rules(db: Session, skip: int = 0, limit: int = 100) -> list[SendRule]:
    return (
        db.query(SendRule)
        .order_by(SendRule.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def list_send_rules_by_provider(
    db: Session, skip: int = 0, limit: int = 100
) -> list[SendRule]:
    return (
        db.query(SendRule)
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
