# custom_components/tasker/tasks.py
import datetime
import uuid
import re

def slugify(value):
    """Simple slugify function to make a safe task ID."""
    value = value.lower().strip()
    # Replace non-alphanumeric characters with underscores
    value = re.sub(r'[^a-z0-9]+', '_', value)
    return value.strip('_')

class Task:
    def __init__(self, friendly_name, description="", start_date=None, recurring=False, recurrence_interval=None, alert=False, task_id=None):
        # Generate a safe task_id from the friendly name if none provided.
        if task_id is None:
            task_id = slugify(friendly_name)
        else:
            task_id = slugify(task_id)
        self.task_id = task_id
        self.friendly_name = friendly_name
        self.description = description
        self.start_date = start_date or datetime.date.today().isoformat()
        self.recurring = recurring
        self.recurrence_interval = recurrence_interval
        self.alert = alert
        self.last_done = None
        self.next_due_date = self.calculate_next_due_date()

    def calculate_next_due_date(self):
        """Calculate the next due date if the task is recurring."""
        if self.recurring:
            # Use last_done if available, else start_date
            base_date = datetime.date.fromisoformat(self.last_done) if self.last_done else datetime.date.fromisoformat(self.start_date)
            if self.recurrence_interval:
                next_due = base_date + datetime.timedelta(days=self.recurrence_interval)
                return next_due.isoformat()
        return None

    def mark_done(self):
        self.last_done = datetime.date.today().isoformat()
        self.next_due_date = self.calculate_next_due_date()

    def to_dict(self):
        return {
            "task_id": self.task_id,
            "friendly_name": self.friendly_name,
            "description": self.description,
            "start_date": self.start_date,
            "recurring": self.recurring,
            "recurrence_interval": self.recurrence_interval,
            "alert": self.alert,
            "last_done": self.last_done,
            "next_due_date": self.next_due_date,
        }

    @classmethod
    def from_dict(cls, data):
        task = cls(
            friendly_name=data.get("friendly_name"),
            description=data.get("description", ""),
            start_date=data.get("start_date"),
            recurring=data.get("recurring", False),
            recurrence_interval=data.get("recurrence_interval"),
            alert=data.get("alert", False),
            task_id=data.get("task_id")
        )
        task.last_done = data.get("last_done")
        task.next_due_date = data.get("next_due_date") or task.calculate_next_due_date()
        return task


class TaskManager:
    def __init__(self, hass, store):
        self.hass = hass
        self.store = store
        self.tasks = {}  # task_id: Task

    async def async_load(self):
        """Load tasks from persistent storage."""
        data = await self.store.async_load()
        if data is not None:
            for task_data in data.get("tasks", []):
                task = Task.from_dict(task_data)
                self.tasks[task.task_id] = task

    async def async_save(self):
        """Save tasks to persistent storage."""
        data = {
            "tasks": [task.to_dict() for task in self.tasks.values()]
        }
        await self.store.async_save(data)

    async def async_add_task(self, task: Task):
        self.tasks[task.task_id] = task
        await self.async_save()
        return task

    async def async_update_task(self, task_id, updates):
        task = self.tasks.get(task_id)
        if not task:
            return None
        # Update allowed fields (avoid overwriting task_id)
        for key, value in updates.items():
            if key in ["friendly_name", "description", "start_date", "recurring", "recurrence_interval", "alert"]:
                setattr(task, key, value)
        # Recalculate next due date if needed
        task.next_due_date = task.calculate_next_due_date()
        await self.async_save()
        return task

    async def async_delete_task(self, task_id):
        if task_id in self.tasks:
            del self.tasks[task_id]
            await self.async_save()
            return True
        return False

    async def async_mark_task_done(self, task_id):
        task = self.tasks.get(task_id)
        if not task:
            return None
        task.mark_done()
        await self.async_save()
        return task

