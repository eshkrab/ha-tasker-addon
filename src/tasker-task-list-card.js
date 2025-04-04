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
        padding: 8px;
        margin: 8px;
        width: 100%;
        box-sizing: border-box;
        background: var(--ha-card-background);
      }
      .task-row {
        display: flex;
        align-items: center;
        padding: 8px;
        border-radius: 24px;
        margin: 4px 0;
        /* Optional: use a subtle overlay or theme variable */
        background: var(--ha-card-background, rgba(255, 255, 255, 0.05));
      }
      .left-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
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

  // When HA sets hass, force a re-render.
  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    this.requestUpdate("hass", oldHass);
  }

  setConfig(config) {
    // Use the title from the card config, or fallback to integration config (if available)
    this.config = { title: config.title || 'Task List' };
  }

  // Retrieve all tasker entities (entity_ids starting with "tasker.")
  _getTasks() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (state) => state.entity_id.startsWith('tasker.')
    );
  }

  // Calculate days until due based on the task's next_due_date attribute.
  _calculateDaysUntil(due_date) {
    if (!due_date) return 'N/A';
    const today = new Date();
    const due = new Date(due_date);
    const diff = due - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  // Compute subtext combining last_done and days until due.
  _computeSubtext(task) {
    const attr = task.attributes || {};
    const daysUntil = this._calculateDaysUntil(attr.next_due_date);
    const lastDone = attr.last_done || 'Never';
    return `Last done: ${lastDone} • Due in: ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
  }

  // Compute left icon based on task state.
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

  // Service call: Edit task (placeholder)
  _editTask(task) {
    console.log("Edit clicked for", task.entity_id);
    // Implement editing behavior (e.g., open a dialog) if needed.
  }

  // Always call mark_task_done with just the task ID.
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
              const leftIcon = this._computeLeftIcon(task);
              const name = attr.friendly_name || task.entity_id;
              const subtext = this._computeSubtext(task);
              return html`
                <div class="task-row">
                  <div class="left-icon">
                    <ha-icon .icon="${leftIcon}"></ha-icon>
                  </div>
                  <div class="task-info">
                    <div class="task-name">${name}</div>
                    <div class="task-subtext">${subtext}</div>
                  </div>
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
