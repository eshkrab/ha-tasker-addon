"""Sensors for Tasker integration."""
import logging
from datetime import datetime, timedelta

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, CONF_TASKS, CONF_NAME, CONF_DUE_DATE, CONF_FREQUENCY, CONF_OVERDUE_ALERT

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback):
    """Set up Tasker sensors from a config entry."""
    tasks_data = entry.options.get(CONF_TASKS, [])

    entities = []
    for task_data in tasks_data:
        entity = TaskSensor(entry, task_data)
        entities.append(entity)

    async_add_entities(entities, update_before_add=True)

    # Store references so we can call mark_done from service
    for e in entities:
        hass.data[DOMAIN][entry.entry_id]["entities"][e.entity_id] = e


class TaskSensor(SensorEntity):
    """A sensor entity representing a single task."""

    def __init__(self, entry: ConfigEntry, task_data: dict):
        self._entry = entry
        self._task_data = task_data
        self._attr_name = f"Task: {task_data[CONF_NAME]}"
        # Make a unique_id from entry + task name
        self._attr_unique_id = f"{entry.entry_id}_{task_data[CONF_NAME].lower().replace(' ', '_')}"
        self._state = None  # store days until due

    @property
    def extra_state_attributes(self):
        return {
            "task_name": self._task_data[CONF_NAME],
            "due_date": self._task_data[CONF_DUE_DATE],
            "frequency": self._task_data[CONF_FREQUENCY],
            "overdue_alert": self._task_data[CONF_OVERDUE_ALERT],
        }

    def update(self):
        """Calculate how many days are left until the due date (if any)."""
        due_str = self._task_data.get(CONF_DUE_DATE)
        if not due_str or due_str == "None":
            self._state = None
            return

        try:
            due_dt = datetime.fromisoformat(due_str)
        except ValueError:
            self._state = None
            return

        today = datetime.now()
        delta = (due_dt.date() - today.date()).days
        self._state = delta

    @property
    def state(self):
        return self._state

    @callback
    def mark_done(self):
        """Mark the task as done, reset or clear due date based on frequency."""
        freq = self._task_data.get(CONF_FREQUENCY, 0)
        if freq and freq > 0:
            # Recurring: push out next due date by freq days
            new_due = datetime.now() + timedelta(days=freq)
            self._task_data[CONF_DUE_DATE] = new_due.isoformat()
        else:
            # One-off: clear the due date
            self._task_data[CONF_DUE_DATE] = None

        # Persist updated tasks back into config entry options
        self._save_task_data()

        # Trigger an immediate state update
        self.schedule_update_ha_state(True)

    def _save_task_data(self):
        """Write the updated task data back into the config entry options."""
        tasks = self._entry.options.get(CONF_TASKS, [])
        for t in tasks:
            if t[CONF_NAME] == self._task_data[CONF_NAME]:
                t.update(self._task_data)

        new_options = dict(self._entry.options)
        new_options[CONF_TASKS] = tasks
        self.hass.config_entries.async_update_entry(
            self._entry, options=new_options
        )

