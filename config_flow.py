import logging
import voluptuous as vol
from datetime import date
from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.const import CONF_NAME
import homeassistant.helpers.config_validation as cv

from .const import (
    DOMAIN, CONF_TASKS,
    CONF_NAME, CONF_DUE_DATE, CONF_FREQUENCY, CONF_OVERDUE_ALERT
)

_LOGGER = logging.getLogger(__name__)

class TaskerConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Main config flow for Tasker to create an initial config entry."""
    VERSION = 1

    async def async_step_user(self, user_input=None):
        """First step: create a new config entry with a name only."""
        if user_input is not None:
            return self.async_create_entry(
                title=user_input[CONF_NAME],
                data={},  # store anything in data if needed
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
        """Return the options flow handler for this entry."""
        return TaskerOptionsFlowHandler(config_entry)


class TaskerOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle the options to add/edit/remove tasks after the entry is created."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize the options flow."""
        self.config_entry = config_entry
        self.selected_task_index = None  # store index of chosen task for editing/removal

    async def async_step_init(self, user_input=None):
        """Options flow entry point. Lets user choose an action: add, edit, or finish."""
        if user_input is not None:
            action = user_input["action"]
            if action == "add_task":
                return await self.async_step_add_task()
            elif action == "edit_task":
                return await self.async_step_select_task()
            else:
                # 'finish' selected, end the options flow
                return self.async_create_entry(
                    title="",
                    data=self.config_entry.options
                )

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Required("action", default="add_task"): vol.In(["add_task", "edit_task", "finish"])
            }),
            description_placeholders={
                # optional: show how many tasks exist
                "count": len(self.config_entry.options.get(CONF_TASKS, [])),
            }
        )

    async def async_step_add_task(self, user_input=None):
        """Allow the user to add a new task (recurring or one-off)."""
        if user_input is not None:
            tasks = self.config_entry.options.get(CONF_TASKS, [])
            # Build the new task
            new_task = {
                CONF_NAME: user_input[CONF_NAME],
                CONF_DUE_DATE: str(user_input[CONF_DUE_DATE]),
                CONF_FREQUENCY: user_input.get(CONF_FREQUENCY, 0),
                CONF_OVERDUE_ALERT: user_input.get(CONF_OVERDUE_ALERT, True),
            }
            tasks.append(new_task)

            new_options = dict(self.config_entry.options)
            new_options[CONF_TASKS] = tasks
            return self.async_create_entry(title="", data=new_options)

        # Show form with empty or default fields
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
            # No tasks to edit; show an error or just skip
            return self.async_show_form(
                step_id="select_task",
                errors={"base": "no_tasks"},
            )

        task_names = [t[CONF_NAME] for t in tasks]

        if user_input is not None:
            selected_name = user_input["task_to_edit"]
            self.selected_task_index = task_names.index(selected_name)
            return await self.async_step_edit_or_remove()

        # Let user pick from existing tasks
        schema = vol.Schema({
            vol.Required("task_to_edit"): vol.In(task_names)
        })
        return self.async_show_form(step_id="select_task", data_schema=schema)

    async def async_step_edit_or_remove(self, user_input=None):
        """Prompt user whether to edit or remove the selected task."""
        if user_input is not None:
            if user_input["action"] == "edit":
                return await self.async_step_edit_task()
            else:
                # remove
                return await self.async_step_remove_task()

        # Show a form with a simple choice: edit or remove
        schema = vol.Schema({
            vol.Required("action", default="edit"): vol.In(["edit", "remove"])
        })
        return self.async_show_form(step_id="edit_or_remove", data_schema=schema)

    async def async_step_edit_task(self, user_input=None):
        """Allow user to change the name, due date, frequency, etc. of the selected task."""
        tasks = self.config_entry.options.get(CONF_TASKS, [])
        if self.selected_task_index is None or self.selected_task_index >= len(tasks):
            return self.async_abort(reason="task_not_found")

        existing_task = tasks[self.selected_task_index]
        existing_name = existing_task.get(CONF_NAME, "")
        existing_due_date_str = existing_task.get(CONF_DUE_DATE, "")
        existing_freq = existing_task.get(CONF_FREQUENCY, 0)
        existing_alert = existing_task.get(CONF_OVERDUE_ALERT, True)

        # Convert stored date string to a Python date for default value
        try:
            parsed_date = date.fromisoformat(existing_due_date_str)
        except ValueError:
            parsed_date = date.today()

        if user_input is not None:
            # user submitted the form; update the task
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

        # Show form with defaults set to the existing task's data
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

