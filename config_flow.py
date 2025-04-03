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
    """Handle the options to add, edit, or remove tasks."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize the options flow."""
        self.config_entry = config_entry
        self.selected_task_index = None  # Index of the chosen task in the list

    async def async_step_init(self, user_input=None):
        """Options flow entry point (menu)."""
        if user_input is not None:
            if user_input["action"] == "add_task":
                return await self.async_step_add_task()
            elif user_input["action"] == "edit_task":
                return await self.async_step_select_task()
            else:  # 'finish'
                return self.async_create_entry(title="", data=self.config_entry.options)

        # Show main menu
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required("action", default="add_task"): vol.In(["add_task", "edit_task", "finish"])
            }),
            description_placeholders={
                "count": len(self.config_entry.options.get(CONF_TASKS, [])),
            }
        )

    async def async_step_add_task(self, user_input=None):
        """Add a new task."""
        if user_input is not None:
            tasks = self.config_entry.options.get(CONF_TASKS, [])
            tasks.append({
                CONF_NAME: user_input[CONF_NAME],
                CONF_DUE_DATE: str(user_input[CONF_DUE_DATE]),
                CONF_FREQUENCY: user_input.get(CONF_FREQUENCY, 0),
                CONF_OVERDUE_ALERT: user_input.get(CONF_OVERDUE_ALERT, True),
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

    async def async_step_select_task(self, user_input=None):
        """Choose which existing task to edit or remove."""
        tasks = self.config_entry.options.get(CONF_TASKS, [])
        if not tasks:
            # No tasks exist, go back to init
            return self.async_show_form(
                step_id="select_task",
                errors={"base": "no_tasks"},
            )

        task_names = [t[CONF_NAME] for t in tasks]

        if user_input is not None:
            # The user selected a task from the dropdown
            selected_name = user_input["task_to_edit"]
            # Find its index in the tasks list
            self.selected_task_index = task_names.index(selected_name)
            # Proceed to edit/remove menu
            return await self.async_step_edit_or_remove()

        # Let user pick a task by name
        schema = vol.Schema({
            vol.Required("task_to_edit"): vol.In(task_names)
        })
        return self.async_show_form(step_id="select_task", data_schema=schema)

    async def async_step_edit_or_remove(self, user_input=None):
        """Ask if the user wants to edit or remove the selected task."""
        if user_input is not None:
            if user_input["action"] == "edit":
                return await self.async_step_edit_task()
            else:
                # remove
                return await self.async_step_remove_task()

        schema = vol.Schema({
            vol.Required("action", default="edit"): vol.In(["edit", "remove"])
        })
        return self.async_show_form(step_id="edit_or_remove", data_schema=schema)

    async def async_step_edit_task(self, user_input=None):
        """Edit fields of the selected task."""
        tasks = self.config_entry.options.get(CONF_TASKS, [])
        if self.selected_task_index is None or self.selected_task_index >= len(tasks):
            return self.async_abort(reason="task_not_found")

        existing_task = tasks[self.selected_task_index]
        existing_name = existing_task[CONF_NAME]
        existing_date_str = existing_task[CONF_DUE_DATE]
        existing_freq = existing_task[CONF_FREQUENCY]
        existing_alert = existing_task.get(CONF_OVERDUE_ALERT, True)

        # Convert date string back to date object if possible
        try:
            parsed_date = date.fromisoformat(existing_date_str)
        except ValueError:
            parsed_date = date.today()

        if user_input is not None:
            # Update the task
            updated_name = user_input[CONF_NAME]
            updated_date = user_input[CONF_DUE_DATE]
            updated_freq = user_input[CONF_FREQUENCY]
            updated_alert = user_input[CONF_OVERDUE_ALERT]

            tasks[self.selected_task_index] = {
                CONF_NAME: updated_name,
                CONF_DUE_DATE: str(updated_date),
                CONF_FREQUENCY: updated_freq,
                CONF_OVERDUE_ALERT: updated_alert,
            }
            new_options = dict(self.config_entry.options)
            new_options[CONF_TASKS] = tasks
            return self.async_create_entry(title="", data=new_options)

        # Show form with current values as defaults
        schema = vol.Schema({
            vol.Required(CONF_NAME, default=existing_name): cv.string,
            vol.Required(CONF_DUE_DATE, default=parsed_date): cv.date,
            vol.Optional(CONF_FREQUENCY, default=existing_freq): vol.Coerce(int),
            vol.Optional(CONF_OVERDUE_ALERT, default=existing_alert): cv.boolean,
        })
        return self.async_show_form(step_id="edit_task", data_schema=schema)

    async def async_step_remove_task(self, user_input=None):
        """Remove the selected task from the list."""
        tasks = self.config_entry.options.get(CONF_TASKS, [])
        if self.selected_task_index is None or self.selected_task_index >= len(tasks):
            return self.async_abort(reason="task_not_found")

        tasks.pop(self.selected_task_index)
        new_options = dict(self.config_entry.options)
        new_options[CONF_TASKS] = tasks
        return self.async_create_entry(title="", data=new_options)

