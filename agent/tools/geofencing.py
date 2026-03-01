"""Geofencing / GPS attendance voice tools."""

from livekit.agents import function_tool
from .core import _send_ui, get_current_employee_id_from_context
import database as db


@function_tool
async def clock_in_gps(latitude: float = 0, longitude: float = 0) -> str:
    """Clock in with GPS location for geofenced attendance.
    If lat/lng are 0, clocks in without location (fallback to regular attendance).
    Call when employee says 'clock in' or 'check in' and location is available."""
    emp_id = get_current_employee_id_from_context()
    lat = latitude if latitude != 0 else None
    lng = longitude if longitude != 0 else None
    result = db.clock_in_with_location(emp_id, lat, lng)
    
    if "error" in result:
        loc = result.get("location", {})
        if loc.get("geofence_valid") == False:
            await _send_ui("GeofenceAlertCard", {
                "type": "blocked",
                "message": result["error"],
                "latitude": lat,
                "longitude": lng,
                "nearestFence": loc.get("geofence_name"),
                "distance": loc.get("distance_meters")
            }, "attendance")
        else:
            await _send_ui("StatusBanner", {"status": "error", "message": result["error"]}, "attendance")
        return result["error"]
    
    loc = result.get("location", {})
    msg = f"Clocked in at {result['time']}"
    if loc.get("geofence_name"):
        msg += f" — {loc['geofence_name']}"
    
    await _send_ui("AttendanceConfirmCard", {
        "action": "clock_in",
        "time": result["time"],
        "geofenceName": loc.get("geofence_name", ""),
        "geofenceValid": loc.get("geofence_valid", True),
        "distance": loc.get("distance_meters"),
        "latitude": lat,
        "longitude": lng
    }, "attendance")
    return msg


@function_tool
async def clock_out_gps(latitude: float = 0, longitude: float = 0) -> str:
    """Clock out with GPS location. Call when employee says 'clock out' or 'check out'."""
    emp_id = get_current_employee_id_from_context()
    lat = latitude if latitude != 0 else None
    lng = longitude if longitude != 0 else None
    result = db.clock_out_with_location(emp_id, lat, lng)
    
    if "error" in result:
        await _send_ui("StatusBanner", {"status": "error", "message": result["error"]}, "attendance")
        return result["error"]
    
    loc = result.get("location", {})
    msg = f"Clocked out at {result['time']} — {result['hours']} hours worked"
    if loc.get("geofence_name"):
        msg += f" at {loc['geofence_name']}"
    
    await _send_ui("AttendanceConfirmCard", {
        "action": "clock_out",
        "time": result["time"],
        "hours": result["hours"],
        "geofenceName": loc.get("geofence_name", ""),
        "geofenceValid": loc.get("geofence_valid", True),
        "distance": loc.get("distance_meters"),
        "latitude": lat,
        "longitude": lng
    }, "attendance")
    return msg


@function_tool
async def list_office_locations() -> str:
    """Show all registered office locations (geofences).
    Call when someone asks about office locations or where they can clock in."""
    fences = db.get_geofences()
    if not fences:
        return "No office locations registered."
    await _send_ui("GeofenceListCard", {
        "locations": [{
            "id": f["id"], "name": f["name"], "description": f.get("description", ""),
            "latitude": f["latitude"], "longitude": f["longitude"],
            "radius": f["radius_meters"], "address": f.get("address", "")
        } for f in fences]
    }, "attendance")
    return f"{len(fences)} office locations registered."


@function_tool
async def manage_geofence(action: str, name: str = "", latitude: float = 0, longitude: float = 0, radius: int = 200, address: str = "") -> str:
    """Add or update office geofence locations. Manager/admin only.
    action: 'add' to create new location, 'list' to show all.
    Call when manager wants to register a new office location."""
    if action == "list":
        return await list_office_locations()
    
    if action == "add":
        if not name or latitude == 0 or longitude == 0:
            return "Please provide name, latitude, and longitude for the new location."
        result = db.create_geofence(name, latitude, longitude, radius, address=address)
        await _send_ui("StatusBanner", {"status": "success", "message": f"Office location added: {name}"}, "attendance")
        return f"Geofence created: {name} (ID: {result['id']}, radius: {radius}m)"
    
    return "Invalid action. Use 'add' or 'list'."
