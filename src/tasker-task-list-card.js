import { LitElement, html, css } from 'lit';

class TaskerStyledTaskListCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  static get styles() {
    return css`
      ha-card {
        /* Use default HA card background & theming */
        padding: 8px;
        margin: 8px;
        width: 100%;
        box-sizing: border-box;
      }
      .task-row {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 24px;
        margin: 4px 0;
        /* Rely on theme for background color, or set a subtle overlay:
           background: var(--ha-card-background, rgba(255, 255, 255, 0.05)); */
      }
      .left-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        /* Use a subtle background that also depends on theme variable */
        background-color: var(--secondary-background-color);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
      }
      .left-icon ha-icon {
        color: var(--primary-text-color);
      }
      .task-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        margin-right: 8px;
      }
      .task-name {
        font-weight: 500;
        font-size: 1em;
        margin: 0;
        color: var(--primary-text-color);
      }
      .task-subtext {
        font-size: 0.9em;
        color: var(--secondary-text-color);
      }
      .task-actions {
        display: flex;
        align-items: center;
      }
      mwc-icon-button {
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
        color: var(--primary-text-color);
        margin-left: 8px;
      }
    `;
  }

  constructor() {
    super();
    this.config = {};
  }

  // Called by HA to pass the hass object
  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    // Use a default title if none is provided
    this.config = { title: config.title || 'My Tasks' };
  }

  // Filter out all "tasker." entities
  _getTasks() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (state) => state.entity_id.startsWith('tasker.')
    );
  }

  _calculateDaysUntil(due_date) {
    if (!due_date) return 'N/A';
    const today = new Date();
    const due = new Date(due_date);
    const diff = due - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  _computeSubtext(task) {
    const attr = task.attributes || {};
    const daysUntil = this._calculateDaysUntil(attr.next_due_date);
    const lastDone = attr.last_done;
    let subtext = "";
    if (lastDone) {
      subtext += `Last done: ${lastDone}`;
    }
    if (daysUntil !== 'N/A') {
      if (subtext) subtext += " • ";
      subtext += `Due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`;
    }
    if (!subtext) {
      subtext = task.state;
    }
    return subtext;
  }

  _computeLeftIcon(task) {
    switch (task.state) {
      case 'done':
        return 'mdi:check-circle';
      case 'overdue':
        return 'mdi:alert-circle';
      case 'pending':
        return 'mdi:timer-sand';
      default:
        return 'mdi:check-circle-outline';
    }
  }

  _editTask(task) {
    console.log("Edit clicked for", task.entity_id);
  }

  _markTaskDone(task) {
    const task_id = String(task.attributes.task_id || task.entity_id.split('.')[1]);
    this._hass.callService('tasker', 'mark_task_done', { task_id });
  }

  _deleteTask(task) {
    const task_id = String(task.attributes.task_id || task.entity_id.split('.')[1]);
    this._hass.callService('tasker', 'delete_task', { task_id });
  }

  render() {
    const tasks = this._getTasks();
    return html`
      <ha-card header="${this.config.title}">
        ${tasks.length === 0
          ? html`<div style="padding:8px;">No tasks available.</div>`
          : tasks.map((task) => {
              const attr = task.attributes || {};
              const icon = this._computeLeftIcon(task);
              const name = attr.friendly_name || task.entity_id;
              const subtext = this._computeSubtext(task);

              return html`
                <div class="task-row">
                  <!-- Left icon circle -->
                  <div class="left-icon">
                    <ha-icon .icon="${icon}"></ha-icon>
                  </div>

                  <!-- Middle text -->
                  <div class="task-info">
                    <div class="task-name">${name}</div>
                    <div class="task-subtext">${subtext}</div>
                  </div>

                  <!-- Right side icon buttons -->
                  <div class="task-actions">
                    <mwc-icon-button @click="${() => this._editTask(task)}">
                      <ha-icon icon="mdi:pencil"></ha-icon>
                    </mwc-icon-button>
                    <mwc-icon-button @click="${() => this._markTaskDone(task)}">
                      <ha-icon icon="mdi:check"></ha-icon>
                    </mwc-icon-button>
                    <mwc-icon-button @click="${() => this._deleteTask(task)}">
                      <ha-icon icon="mdi:delete"></ha-icon>
                    </mwc-icon-button>
                  </div>
                </div>
              `;
            })}
      </ha-card>
    `;
  }
}

customElements.define('tasker-task-list-card', TaskerStyledTaskListCard);
console.log('tasker-styled-task-list-card registered', customElements.get('tasker-task-list-card'));
