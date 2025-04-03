# custom_components/tasker/__init__.py
import logging
from homeassistant.core import HomeAssistant

DOMAIN = "tasker"
_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: dict):
    _LOGGER.info("Setting up Tasker integration")
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN]["tasks"] = []  # A simple in-memory storage. Consider persistence later.

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
                # If recurring, schedule the next due date
                if task["recurrence"]:
                    task["done"] = False  # Reset status for next cycle
                break

    async def handle_delete_task(call):
        task_name = call.data.get("name")
        tasks = hass.data[DOMAIN]["tasks"]
        hass.data[DOMAIN]["tasks"] = [task for task in tasks if task["name"] != task_name]
        _LOGGER.info("Deleted task: %s", task_name)
        # Remove state
        hass.states.async_remove(f"{DOMAIN}.{task_name}")

    # Register services
    hass.services.async_register(DOMAIN, "add_task", handle_add_task)
    hass.services.async_register(DOMAIN, "mark_task_done", handle_mark_task_done)
    hass.services.async_register(DOMAIN, "delete_task", handle_delete_task)

    # Optionally, add more services like "edit_task" as needed

    # Register HTTP views for ESPHome integration (see next section)
    from .views import TaskerResetView
    hass.http.register_view(TaskerResetView)

    return True

