"""Config flow for Tasker."""
import logging
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.const import CONF_NAME
import homeassistant.helpers.config_validation as cv

from .const import DOMAIN, CONF_TASKS, CONF_NAME, CONF_DUE_DATE, CONF_FREQUENCY, CONF_OVERDUE_ALERT

_LOGGER = logging.getLogger(__name__)

class TaskerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Tasker."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """First step: create the config entry with a "name" only."""
        if user_input is not None:
            return self.async_create_entry(
                title=user_input[CONF_NAME],
                data={},  # store anything in `data` if needed
                options={
                    CONF_TASKS: []
                }
            )

        schema = vol.Schema({
            vol.Required(CONF_NAME, default="My House Tasks"): cv.string
        })
        return self.async_show_form(step_id="user", data_schema=schema)

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return TaskerOptionsFlowHandler(config_entry)


class TaskerOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle the options to add/edit tasks."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize the options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Menu to choose what to do: add a new task, or finish."""
        if user_input is not None:
            if user_input["action"] == "add_task":
                return await self.async_step_add_task()
            else:
                return self.async_create_entry(title="", data=self.config_entry.options)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required("action", default="add_task"): vol.In(
                    ["add_task", "finish"]
                )
            })
        )

    async def async_step_add_task(self, user_input=None):
        """Add a new task."""
        if user_input is not None:
            tasks = self.config_entry.options.get(CONF_TASKS, [])
            tasks.append({
                CONF_NAME: user_input[CONF_NAME],
                CONF_DUE_DATE: str(user_input[CONF_DUE_DATE]),
                CONF_FREQUENCY: user_input[CONF_FREQUENCY],
                CONF_OVERDUE_ALERT: user_input[CONF_OVERDUE_ALERT],
            })
            new_options = dict(self.config_entry.options)
            new_options[CONF_TASKS] = tasks
            return self.async_create_entry(title="", data=new_options)

        schema = vol.Schema({
            vol.Required(CONF_NAME): cv.string,
            vol.Required(CONF_DUE_DATE): cv.date,
            vol.Optional(CONF_FREQUENCY, default=0): vol.Coerce(int),
            vol.Optional(CONF_OVERDUE_ALERT, default=True): cv.boolean,
        })
        return self.async_show_form(step_id="add_task", data_schema=schema)


