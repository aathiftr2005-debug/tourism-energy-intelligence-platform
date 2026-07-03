from fastapi import APIRouter

router = APIRouter(tags=["Regions"])

REGIONS = [
    {"code": "ES", "name": "Spain", "tourism_flux": "high", "stress_index": 72.3},
    {"code": "IT", "name": "Italy", "tourism_flux": "high", "stress_index": 68.1},
    {"code": "FR", "name": "France", "tourism_flux": "high", "stress_index": 65.4},
    {"code": "GR", "name": "Greece", "tourism_flux": "high", "stress_index": 81.2},
    {"code": "PT", "name": "Portugal", "tourism_flux": "medium", "stress_index": 58.7},
    {"code": "HR", "name": "Croatia", "tourism_flux": "medium", "stress_index": 62.5},
]


@router.get("/regions")
async def get_regions():
    return REGIONS


@router.get("/regions/{code}")
async def get_region(code: str):
    for r in REGIONS:
        if r["code"] == code.upper():
            return r
    return {"error": "Region not found"}
