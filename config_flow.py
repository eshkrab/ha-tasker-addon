# custom_components/tasker/config_flow.py
import logging
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback

from .const import DOMAIN, DEFAULT_RECURRENCE, DEFAULT_TASK_LIST_NAME

_LOGGER = logging.getLogger(__name__)

class TaskerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Tasker integration."""
    VERSION = 1
    CONNECTION_CLASS = config_entries.CONN_CLASS_LOCAL_POLL

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        errors = {}
        if user_input is not None:
            # The title of the config entry will be the task list name
            return self.async_create_entry(title=user_input["task_list_name"], data=user_input)
        
        data_schema = vol.Schema({
            vol.Required("task_list_name", default=DEFAULT_TASK_LIST_NAME): str,
            vol.Optional("default_recurrence", default=DEFAULT_RECURRENCE): int,
        })
        return self.async_show_form(
            step_id="user",
            data_schema=data_schema,
            errors=errors
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Define the options flow."""
        return TaskerOptionsFlowHandler(config_entry)


class TaskerOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle an options flow for Tasker."""
    def __init__(self, config_entry):
        # Use a private variable to avoid the deprecation warning
        self._config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)
        
        data_schema = vol.Schema({
            vol.Required("task_list_name", default=self._config_entry.data.get("task_list_name", DEFAULT_TASK_LIST_NAME)): str,
            vol.Optional("default_recurrence", default=self._config_entry.options.get("default_recurrence", DEFAULT_RECURRENCE)): int,
        })
        return self.async_show_form(
            step_id="init",
            data_schema=data_schema
        )

