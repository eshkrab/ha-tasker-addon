# custom_components/tasker/__init__.py
import logging
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.storage import Store

from .const import DOMAIN, STORE_VERSION, STORE_KEY
from .tasks import Task, TaskManager

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: dict):
    """Set up the integration via YAML if needed (not used with config flow)."""
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry):
    _LOGGER.info("Setting up Tasker integration from config entry")
    
    hass.data.setdefault(DOMAIN, {})
    store = Store(hass, STORE_VERSION, STORE_KEY)
    task_manager = TaskManager(hass, store)
    await task_manager.async_load()
    hass.data[DOMAIN][entry.entry_id] = {
        "task_manager": task_manager,
        "config": entry.data,
    }

    async def handle_add_task(call):
        data = call.data
        friendly_name = data.get("friendly_name")
        if not friendly_name:
            _LOGGER.error("Task must have a friendly_name")
            return
        new_task = Task(
            friendly_name=friendly_name,
            description=data.get("description", ""),
            start_date=data.get("start_date"),
            recurring=data.get("recurring", False),
            recurrence_interval=data.get("recurrence_interval"),
            alert=data.get("alert", False)
        )
        await task_manager.async_add_task(new_task)
        _LOGGER.info("Added task: %s", new_task.to_dict())
        hass.states.async_set(f"{DOMAIN}.{new_task.task_id}", new_task.state)
    
    async def handle_update_task(call):
        task_id = call.data.get("task_id")
        if not task_id:
            _LOGGER.error("Task update must include task_id")
            return
        updates = call.data.copy()
        updates.pop("task_id", None)
        updated_task = await task_manager.async_update_task(task_id, updates)
        if updated_task:
            _LOGGER.info("Updated task: %s", updated_task.to_dict())
            hass.states.async_set(f"{DOMAIN}.{task_id}", updated_task.state)
        else:
            _LOGGER.error("No task with id %s found", task_id)
    
    async def handle_delete_task(call):
        task_id = call.data.get("task_id")
        if not task_id:
            _LOGGER.error("Task delete must include task_id")
            return
        result = await task_manager.async_delete_task(task_id)
        if result:
            _LOGGER.info("Deleted task with id %s", task_id)
            hass.states.async_remove(f"{DOMAIN}.{task_id}")
        else:
            _LOGGER.error("No task with id %s found", task_id)
    
    async def handle_mark_task_done(call):
        task_id = call.data.get("task_id")
        if not task_id:
            _LOGGER.error("Mark task done requires task_id")
            return
        task = await task_manager.async_mark_task_done(task_id)
        if task:
            _LOGGER.info("Marked task %s as done", task_id)
            hass.states.async_set(f"{DOMAIN}.{task_id}", task.state)
        else:
            _LOGGER.error("No task with id %s found", task_id)
    
    hass.services.async_register(DOMAIN, "add_task", handle_add_task)
    hass.services.async_register(DOMAIN, "update_task", handle_update_task)
    hass.services.async_register(DOMAIN, "delete_task", handle_delete_task)
    hass.services.async_register(DOMAIN, "mark_task_done", handle_mark_task_done)
    
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry):
    """Unload a config entry."""
    _LOGGER.info("Unloading Tasker integration")
    if entry.entry_id in hass.data[DOMAIN]:
        hass.data[DOMAIN].pop(entry.entry_id)
    return True

