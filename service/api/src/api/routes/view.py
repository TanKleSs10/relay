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