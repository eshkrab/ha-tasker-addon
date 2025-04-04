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
        /* No explicit background set, so it uses the theme's default */
        padding: 16px;
        // margin: 8px;
        width: 100%;
        box-sizing: border-box;
      }
      .task-row {
        display: flex;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid var(--divider-color, #dcdcdc);
      }
      .task-row:last-child {
        border-bottom: none;
      }
      .left-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        /* Also no forced background color here; it inherits from the card or theme */
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
      }
      .left-icon ha-icon {
        color: var(--primary-text-color);
      }
      .task-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .task-name {
        font-size: 1.1em;
        font-weight: bold;
        margin: 0;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .task-subtext {
        font-size: 0.9em;
        color: var(--secondary-text-color);
        margin-top: 2px;
      }
      .task-actions {
        display: flex;
        gap: 8px;
      }
      mwc-icon-button {
        --mdc-icon-button-size: 36px;
        --mdc-icon-size: 20px;
        color: var(--primary-text-color);
      }
    `;
  }

  constructor() {
    super();
    this.config = {};
  }

  // Force re-render whenever hass changes
  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;
    this.requestUpdate("hass", oldHass);
  }

  setConfig(config) {
    this.config = { title: config.title || 'My Tasks' };
  }

  // Return all tasker.* entities
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
    const lastDone = attr.last_done || 'Never';
    return `Last done: ${lastDone} • Due in: ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`;
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
    // Implement your edit functionality here
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
                  <div class="left-icon">
                    <ha-icon .icon="${icon}"></ha-icon>
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
console.log('tasker-task-list-card registered', customElements.get('tasker-task-list-card'));
