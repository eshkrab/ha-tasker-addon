# custom_components/tasker/tasks.py
import datetime
import uuid
import re
from datetime import date, timedelta

def slugify(value):
    """Simple slugify function to make a safe task ID."""
    value = value.lower().strip()
    value = re.sub(r'[^a-z0-9]+', '_', value)
    return value.strip('_')

class Task:
    def __init__(self, friendly_name, description="", start_date=None, recurring=False,
                 recurrence_interval=None, alert=False, task_id=None, manual_state=None):
        # Generate a safe task_id from the friendly name if none is provided.
        if task_id is None:
            task_id = slugify(friendly_name)
        else:
            task_id = slugify(task_id)
        self.task_id = task_id
        self.friendly_name = friendly_name
        self.description = description
        self.start_date = start_date or date.today().isoformat()  # ISO date string YYYY-MM-DD
        self.recurring = recurring
        self.recurrence_interval = recurrence_interval  # in days
        self.alert = alert
        self.last_done = None
        self.manual_state = manual_state  # can be set to "in_progress" manually
        self.next_due_date = self.calculate_next_due_date()

    def calculate_next_due_date(self):
        """Calculate the next due date for recurring tasks."""
        if self.recurring:
            # If the task was done before, base the next due date on that;
            # otherwise, use the start date.
            base_date = date.fromisoformat(self.last_done) if self.last_done else date.fromisoformat(self.start_date)
            if self.recurrence_interval:
                next_due = base_date + timedelta(days=self.recurrence_interval)
                return next_due.isoformat()
        return None

    def mark_done(self):
        """Mark task as done and update the next due date for recurring tasks."""
        self.last_done = date.today().isoformat()
        # Clear any manual state override.
        self.manual_state = None
        self.next_due_date = self.calculate_next_due_date()

    @property
    def state(self):
        """Compute the task state based on dates and manual overrides."""
        # If manually set to "in_progress", return that.
        if self.manual_state:
            return self.manual_state

        today = date.today()

        # For non-recurring tasks:
        if not self.recurring:
            due_date = date.fromisoformat(self.start_date) if self.start_date else None
            # Once done, non-recurring tasks remain done.
            if self.last_done:
                return "done"
            if due_date:
                if today < due_date:
                    return "scheduled"
                elif today == due_date:
                    return "pending"
                elif today > due_date:
                    return "overdue"
            return "pending"

        # For recurring tasks:
        # Use next_due_date if available, otherwise fall back to start_date.
        due_date_str = self.next_due_date if self.last_done else self.start_date
        if due_date_str:
            due_date = date.fromisoformat(due_date_str)
            if today < due_date:
                return "scheduled"
            elif today == due_date:
                return "pending"
            elif today > due_date:
                return "overdue"
        return "pending"

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
            "manual_state": self.manual_state,
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
            task_id=data.get("task_id"),
            manual_state=data.get("manual_state")
        )
        task.last_done = data.get("last_done")
        task.next_due_date = data.get("next_due_date") or task.calculate_next_due_date()
        return task

