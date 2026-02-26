from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

router = APIRouter()
templates = Jinja2Templates(directory="src/templates")


@router.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("panel.html", {"request": request})

@router.get("/create-campaign", response_class=HTMLResponse)
async def create_campaign(request: Request):
    return templates.TemplateResponse("createCampaign.html", {"request": request})

@router.get("/manage-campaign/{campaign_id}", response_class=HTMLResponse)
async def manage_campaign(request: Request, campaign_id: str):
    return templates.TemplateResponse("manageCampaign.html", {"request": request, "campaign_id": campaign_id})

@router.get("/message-form", response_class=HTMLResponse)
async def message_form(request: Request):
    return templates.TemplateResponse("messageForm.html", {"request": request})


@router.get("/manage-channels", response_class=HTMLResponse)
async def manage_channels(request: Request):
    return templates.TemplateResponse("manageChannels.html", {"request": request})