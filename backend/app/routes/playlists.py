from fastapi import APIRouter, Depends, File, Form, UploadFile
from app.models.schemas import PlaylistCreate, PlaylistItemCreate
from app.services.mongodb_service import (
    create_playlist,
    get_playlists_for_user,
    delete_playlist,
    add_item_to_playlist,
    get_playlist_items,
    remove_item_from_playlist,
)
from app.auth.deps import get_current_user
from app.services.pipeline_service import process_pdf_pipeline

router = APIRouter()


@router.post("/")
def create_playlist_route(
    data: PlaylistCreate,
    current_user: dict = Depends(get_current_user),
):
    playlist_id = create_playlist(
        user_id=current_user["sub"],
        title=data.title,
        description=data.description or "",
    )
    return {"playlist_id": playlist_id}


@router.get("/")
def list_playlists(
    current_user: dict = Depends(get_current_user),
):
    return get_playlists_for_user(current_user["sub"])


@router.delete("/{playlist_id}")
def delete_playlist_route(
    playlist_id: str,
    current_user: dict = Depends(get_current_user),
):
    return delete_playlist(current_user["sub"], playlist_id)


@router.post("/{playlist_id}/items")
def add_item(
    playlist_id: str,
    data: PlaylistItemCreate,
    current_user: dict = Depends(get_current_user),
):
    item_id = add_item_to_playlist(
        playlist_id=playlist_id,
        name=data.name,
        summary_id=data.summary_id,
        quiz_id=data.quiz_id,
        pdf_url=data.pdf_url,
        audio_path=data.audio_path,
        
    )
    return {"item_id": item_id}


@router.get("/{playlist_id}/items")
def get_items(
    playlist_id: str,
    current_user: dict = Depends(get_current_user),
):
    return get_playlist_items(playlist_id)


@router.delete("/items/{item_id}")
def delete_item(
    item_id: str,
    current_user: dict = Depends(get_current_user),
):
    return remove_item_from_playlist(item_id)


@router.post("/{playlist_id}/upload-item")
async def upload_item_to_playlist(
    playlist_id: str,
    file: UploadFile = File(...),
    name: str | None = Form(None),
    current_user: dict = Depends(get_current_user),
):
    result = await process_pdf_pipeline(
        user_id=current_user["sub"],
        file=file,
        name=name,
    )

    item_id = add_item_to_playlist(
        playlist_id=playlist_id,
        name=name or file.filename,
        summary_id=result["summary_id"],
        quiz_id=result["quiz_id"],
        pdf_url=result["pdf_url"],
        audio_path=result["audio_path"],
    )

    return {
        "item_id": item_id,
        "playlist_id": playlist_id,
        "summary_id": result["summary_id"],
        "quiz_id": result["quiz_id"],
        "pdf_url": result["pdf_url"],
        "audio_path": result["audio_path"],
    }