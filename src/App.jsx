from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db
from app.core.config import settings
from app.models.app_profile import AppProfile
from app.models.app_profile_member import AppProfileMember
from app.models.meetup import Meetup
from app.models.user import User
from app.schemas.profile import (
    PublicProfileMeetupOut,
    PublicProfileMemberOut,
    PublicProfileOut,
)

router = APIRouter(prefix="/users", tags=["users"])


def _media_base_url() -> str:
    raw = (settings.API_BASE_URL or "").strip()
    return raw.rstrip("/")


def _build_media_url(relative_path: str | None) -> str | None:
    if not relative_path:
        return None
    base = _media_base_url()
    if not base:
        return relative_path
    if relative_path.startswith("http://") or relative_path.startswith("https://"):
        return relative_path
    return f"{base}{relative_path}"


def _as_utc_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc)


def _utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _serialize_meetup(meetup: Meetup) -> PublicProfileMeetupOut:
    return PublicProfileMeetupOut(
        id=meetup.id,
        starts_at=_as_utc_aware(meetup.starts_at),
        meeting_point=meetup.meeting_point,
        notes=meetup.notes,
        level_tag=meetup.level_tag,
        pace_min=meetup.pace_min,
        pace_max=meetup.pace_max,
        capacity=meetup.capacity,
        status=meetup.status,
        creator_profile_id=meetup.creator_profile_id,
    )


def _get_profile_or_404(db: Session, profile_id: int) -> AppProfile:
    profile = db.get(AppProfile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return profile


def _get_profile_by_handle_or_404(db: Session, handle: str) -> AppProfile:
    normalized = handle.strip().lower().lstrip("@")

    profile = db.execute(
        select(AppProfile).where(AppProfile.handle == normalized)
    ).scalar_one_or_none()

    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    return profile


def _get_group_members(db: Session, profile_id: int) -> list[PublicProfileMemberOut]:
    rows = db.execute(
        select(AppProfileMember, User)
        .join(User, User.id == AppProfileMember.user_id)
        .where(AppProfileMember.profile_id == profile_id)
        .order_by(AppProfileMember.id.asc())
    ).all()

    if not rows:
        return []

    user_ids = [user.id for _, user in rows]
    individual_profiles = db.execute(
        select(AppProfile).where(
            AppProfile.profile_type == "individual",
            AppProfile.source_user_id.in_(user_ids),
        )
    ).scalars().all()
    individual_profile_by_user_id = {
        p.source_user_id: p for p in individual_profiles if p.source_user_id is not None
    }

    out: list[PublicProfileMemberOut] = []
    for membership, user in rows:
        individual_profile = individual_profile_by_user_id.get(user.id)
        out.append(
            PublicProfileMemberOut(
                user_id=user.id,
                profile_id=(individual_profile.id if individual_profile else None),
                handle=(individual_profile.handle if individual_profile else user.handle),
                full_name=(
                    individual_profile.display_name
                    if individual_profile
                    else (user.full_name or user.handle or user.email)
                ),
                avatar_url=_build_media_url(
                    individual_profile.avatar_url if individual_profile else user.avatar_url
                ),
                role=membership.role,
            )
        )
    return out


def _get_profile_meetups(
    db: Session,
    profile_id: int,
) -> tuple[list[PublicProfileMeetupOut], list[PublicProfileMeetupOut]]:
    now_utc = _utc_now_naive()

    meetups = db.execute(
        select(Meetup)
        .where(Meetup.creator_profile_id == profile_id)
        .order_by(Meetup.starts_at.desc())
    ).scalars().all()

    future_meetups: list[PublicProfileMeetupOut] = []
    past_meetups: list[PublicProfileMeetupOut] = []

    for meetup in meetups:
        serialized = _serialize_meetup(meetup)
        if meetup.starts_at >= now_utc and meetup.status in {"open", "full"}:
            future_meetups.append(serialized)
        else:
            past_meetups.append(serialized)

    future_meetups.sort(key=lambda m: m.starts_at)
    past_meetups.sort(key=lambda m: m.starts_at, reverse=True)

    return future_meetups, past_meetups


def _serialize_public_profile(db: Session, profile: AppProfile) -> PublicProfileOut:
    members: list[PublicProfileMemberOut] = []
    if profile.profile_type == "group":
        members = _get_group_members(db, profile.id)

    future_meetups, past_meetups = _get_profile_meetups(db, profile.id)

    return PublicProfileOut(
        id=profile.id,
        profile_type=profile.profile_type,
        handle=profile.handle,
        display_name=profile.display_name,
        bio=profile.bio,
        location=profile.location,
        avatar_url=_build_media_url(profile.avatar_url),
        links=profile.links or {},
        is_private=bool(profile.is_private),
        followers_count=0,
        following_count=0,
        members=members,
        future_meetups=future_meetups,
        past_meetups=past_meetups,
        reviews=[],
    )


@router.get("/by-handle/{handle}")
def get_user_by_handle(handle: str, db: Session = Depends(get_db)):
    """
    Endpoint legacy para login por handle.
    Se mantiene simple para no romper el flujo actual de auth.
    """
    normalized = handle.strip().lower().lstrip("@")

    user = db.execute(
        select(User).where(User.handle == normalized)
    ).scalar_one_or_none()

    if not user or user.is_deleted:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not user.email:
        raise HTTPException(status_code=400, detail="Usuario sin email válido")

    return {
        "email": user.email,
        "handle": user.handle,
    }


@router.get("/profiles/{profile_id}", response_model=PublicProfileOut)
def get_public_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = _get_profile_or_404(db, profile_id)
    return _serialize_public_profile(db, profile)


@router.get("/profiles/by-handle/{handle}", response_model=PublicProfileOut)
def get_public_profile_by_handle(handle: str, db: Session = Depends(get_db)):
    profile = _get_profile_by_handle_or_404(db, handle)
    return _serialize_public_profile(db, profile)
