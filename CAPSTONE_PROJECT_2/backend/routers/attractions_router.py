from fastapi import APIRouter, Query, HTTPException, Body
from typing import Optional, List
from pydantic import BaseModel

from backend.database.manager import (
    get_attractions_catalog,
    get_attraction_detail_data,
    add_attraction_record,
    edit_attraction_record,
    delete_attraction_record,
    execute_query,
    require_oracle,
    OracleNotConnectedException
)

router = APIRouter(prefix="/api/attractions", tags=["Attraction Management & Analytics"])

class AttractionCreate(BaseModel):
    name: str
    city: str
    category: str
    latitude: float
    longitude: float
    capacity: int = 1000
    description: Optional[str] = ""

@router.get("")
@router.get("/")
def list_attractions(
    city: str = Query("All", description="Filter by city"),
    category: str = Query("all", description="Filter by category"),
    sort_by: str = Query("popularity", description="Sort criteria: popularity, visits, name"),
    search: str = Query(None, description="Search keyword")
):
    """Retrieves monitored attractions list from Oracle Database."""
    try:
        return get_attractions_catalog(city=city, category=category, sort_by=sort_by, search=search)
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/cities/list")
def list_monitored_cities():
    """Returns distinct metropolitan cities from Oracle Database."""
    try:
        require_oracle()
        rows = execute_query("SELECT DISTINCT city FROM ATTRACTIONS ORDER BY city ASC")
        return [r["city"] for r in rows]
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/{attraction_id}")
def get_attraction_detail(attraction_id: int):
    """Retrieves detailed hourly and telemetry analytics for a single attraction from Oracle."""
    try:
        data = get_attraction_detail_data(attraction_id)
        if not data:
            raise HTTPException(status_code=404, detail="Attraction not found.")
        return data
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("")
@router.post("/")
def create_attraction(attr: AttractionCreate):
    """Adds a new monitored destination to Oracle Database."""
    try:
        data = attr.model_dump() if hasattr(attr, "model_dump") else attr.dict()
        add_attraction_record(data)
        return {"status": "success", "message": f"Successfully created destination '{attr.name}' in Oracle Database."}
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{attraction_id}")
def update_attraction(attraction_id: int, attr: AttractionCreate):
    """Updates destination capacity and metadata in Oracle Database."""
    try:
        data = attr.model_dump() if hasattr(attr, "model_dump") else attr.dict()
        edit_attraction_record(attraction_id, data)
        return {"status": "success", "message": f"Successfully updated attraction {attraction_id} in Oracle Database."}
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{attraction_id}")
def remove_attraction(attraction_id: int):
    """Removes a destination from Oracle Database."""
    try:
        delete_attraction_record(attraction_id)
        return {"status": "success", "message": f"Successfully deleted attraction {attraction_id} from Oracle Database."}
    except OracleNotConnectedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
