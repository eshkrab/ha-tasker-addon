# custom_components/tasker/__init__.py
import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry

DOMAIN = "tasker"
_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: dict):
    """Set up the integration via YAML if needed (not used if using config flow)."""
    # Returning True here, but actual setup happens in async_setup_entry
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Set up the Tasker integration from a config entry."""
    _LOGGER.info("Setting up Tasker integration from config entry")
    
    # Using the entry_id for a per-entry data storage (can be useful if you later add multiple entries)
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {}
    
    # Initialize our tasks storage. This could be replaced with persistence later.
    hass.data[DOMAIN]["tasks"] = []
    
    async def handle_add_task(call):
        task_name = call.data.get("name")
        recurrence = call.data.get("recurrence")  # e.g., number of days
        # Basic task structure. You can extend with more fields.
        task = {
            "name": task_name,
            "recurrence": recurrence,
            "done": False,
            "last_done": None
        }
        hass.data[DOMAIN]["tasks"].append(task)
        _LOGGER.info("Added task: %s", task)
        # Optionally, update a state so the UI can react
        hass.states.async_set(f"{DOMAIN}.{task_name}", "pending")
    
    async def handle_mark_task_done(call):
        task_name = call.data.get("name")
        tasks = hass.data[DOMAIN]["tasks"]
        for task in tasks:
            if task["name"] == task_name:
                task["done"] = True
                task["last_done"] = hass.helpers.event.dt_util.utcnow().isoformat()
                _LOGGER.info("Task marked as done: %s", task)
                # Update state accordingly
                hass.states.async_set(f"{DOMAIN}.{task_name}", "done")
                # If recurring, reset the status for the next cycle
                if task["recurrence"]:
                    task["done"] = False
                break
    
    async def handle_delete_task(call):
        task_name = call.data.get("name")
        tasks = hass.data[DOMAIN]["tasks"]
        hass.data[DOMAIN]["tasks"] = [task for task in tasks if task["name"] != task_name]
        _LOGGER.info("Deleted task: %s", task_name)
        # Remove state from Home Assistant
        hass.states.async_remove(f"{DOMAIN}.{task_name}")
    
    # Register services
    hass.services.async_register(DOMAIN, "add_task", handle_add_task)
    hass.services.async_register(DOMAIN, "mark_task_done", handle_mark_task_done)
    hass.services.async_register(DOMAIN, "delete_task", handle_delete_task)
    
    # Register HTTP view for ESPHome integration
    from .views import TaskerResetView
    hass.http.register_view(TaskerResetView)
    
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Unload a config entry."""
    _LOGGER.info("Unloading Tasker integration")
    # Perform any cleanup if needed
    if entry.entry_id in hass.data[DOMAIN]:
        hass.data[DOMAIN].pop(entry.entry_id)
    return True

