# Tasker: A Custom Integration for Managing Recurring & One-Off Tasks in Home Assistant

Tasker is a lightweight custom integration that lets you manage both recurring and one-off tasks, chores, or maintenance items directly within Home Assistant.

- Add, edit, or remove tasks from a clean UI-based Config Flow—no YAML required.
- Each task becomes a sensor with a state of “days until due.”
- Recurrence: Automatically resets due dates after you “mark done.”
- One-off tasks: Clear the due date after completion.
- Overdue checks: Optionally enable overdue alerts for specific tasks.

## Features

- **UI Configuration**: Add or remove tasks in *Settings → Devices & Services → Integrations → Tasker*.
- **Recurring or One-Off**: Specify a frequency in days. If it’s 0, the task is one-off.
- **Mark Done**: A single service call to reset or clear the due date.
- **Overdue Alerts**: If enabled, you can create daily automations that notify you when tasks go overdue (or are due today).
- **No External Dependencies**: Entirely local—no cloud service or big add-on required.

## Installation

1. **Download or clone** this repository into your Home Assistant `custom_components` folder:
   
<config>/custom_components/tasker/ ├── init.py ├── manifest.json ├── config_flow.py ├── const.py ├── sensor.py └── services.yaml

markdown
Copy

*If the `custom_components` folder doesn’t exist, create it in the same directory as your `configuration.yaml`.*

2. **Restart** Home Assistant so it recognizes the new integration.

## Configuration

1. **Add Integration**:
- Go to **Settings → Devices & Services → Integrations**.
- Click **+ Add Integration**, search for **Tasker**, and select it.
- Enter a display name (e.g. “My House Tasks”). This creates a config entry.

2. **Add / Edit Tasks**:
- After the config entry is created, click **Configure** on your new “My House Tasks” card.
- A menu allows you to **Add Task** or **Edit/Remove Task**.
- When you add or edit a task, you’ll set:
  - **Name** (unique label for the task)
  - **Due Date** (ISO date format for the next due time)
  - **Frequency** (recurring in days; 0 = one-off)
  - **Overdue Alert** (boolean; if true, you can use it in your notifications)

3. **Entities**:
- Each task creates a `sensor.task_<name>` entity.
- The sensor state = “days until due.”
- The attributes include `due_date`, `frequency`, `overdue_alert`, etc.

## Marking Tasks Done

- **Service**: `tasker.mark_done`
- **Usage** (in Developer Tools → Services or automations):

```yaml
service: tasker.mark_done
data:
 entity_id: sensor.task_cat_litter_box_1
Behavior:

If frequency > 0, the due date is pushed out by that many days.

If frequency == 0, the task’s due date is cleared (marking it complete).

Example Lovelace Setup
To show and complete tasks in the UI, you can use an Entities card plus a button:

yaml
Copy
type: entities
title: Household Tasks
entities:
  - entity: sensor.task_cat_litter_box_1
  - type: button
    name: "Mark Litter Box 1 Done"
    tap_action:
      action: call-service
      service: tasker.mark_done
      service_data:
        entity_id: sensor.task_cat_litter_box_1
Repeat for other tasks as needed, or use a custom row for a more compact layout.

Example Daily Notification
Create a daily automation to notify you of tasks that are due or overdue:

yaml
Copy
alias: "Daily Task Reminder"
trigger:
  - platform: time
    at: "08:00:00"
action:
  - variables:
      tasks: >
        {{ states.sensor
           | selectattr('entity_id','match','sensor.task_*')
           | list }}
  - service: notify.telegram_bot
    data:
      message: >-
        {% set due_list = [] %}
        {% for t in tasks %}
          {% if t.state != 'unknown' and t.state|int <= 0 %}
            {% set due_list = due_list + [ "• " ~ t.attributes.task_name ~ " (due now)" ] %}
          {% endif %}
        {% endfor %}
        {% if due_list|length == 0 %}
          All tasks are up to date!
        {% else %}
          *Tasks Due or Overdue*:
          {{ due_list|join('\n') }}
        {% endif %}
Adjust the notification service (e.g., telegram_bot, mobile_app, etc.) and time to suit your needs.

Contributing or Issues
Feel free to open issues or pull requests on the GitHub repository if you encounter problems or have improvements.

This is a work-in-progress sample integration; additional features like better date/time handling, custom scheduling, or separate tasks for hour/minute intervals can be added.

License
MIT (or whichever license you prefer).

Enjoy your streamlined Home Assistant tasks management with Tasker!
