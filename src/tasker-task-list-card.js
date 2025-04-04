import { LitElement, html, css } from 'lit';

class TaskerTaskListCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
    };
  }

  static get styles() {
    return css`
      ha-card {
        padding: 16px;
        margin: 8px;
      }
      .task {
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid var(--divider-color, #ccc);
        padding: 8px 0;
      }
      .task:last-child {
        border-bottom: none;
      }
      .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .task-name {
        font-weight: bold;
        margin: 0;
      }
      .task-info {
        font-size: 0.9em;
        color: var(--primary-text-color, #333);
        margin-top: 4px;
      }
      .task-actions {
        margin-top: 8px;
        text-align: right;
      }
      mwc-button {
        margin-left: 8px;
      }
    `;
  }

  constructor() {
    super();
    this.config = {};
  }

  // HA passes the hass object into the card via this setter.
  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this.config = { title: config.title || 'Task List' };
  }

  // Retrieves all tasker entities (those with entity_ids starting with "tasker.")
  _getTasks() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (state) => state.entity_id.startsWith('tasker.')
    );
  }

  // Calculates days until due date based on the task's next_due_date attribute.
  _calculateDaysUntil(due_date) {
    if (!due_date) return 'N/A';
    const today = new Date();
    const due = new Date(due_date);
    const diff = due - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  _markTaskDone(task) {
    // Expect task.attributes.task_id to exist
    this._hass.callService('tasker', 'mark_task_done', { task_id: task.attributes.task_id });
  }

  _deleteTask(task) {
    this._hass.callService('tasker', 'delete_task', { task_id: task.attributes.task_id });
  }

  render() {
    const tasks = this._getTasks();
    return html`
      <ha-card header="${this.config.title}">
        ${tasks.length === 0
          ? html`<div>No tasks available.</div>`
          : tasks.map((task) => {
              const attr = task.attributes;
              const daysUntil = this._calculateDaysUntil(attr.next_due_date);
              return html`
                <div class="task">
                  <div class="task-header">
                    <div class="task-name">${attr.friendly_name || 'Unnamed Task'}</div>
                    <div class="task-actions">
                      <mwc-button raised @click="${() => this._markTaskDone(task)}">
                        Done
                      </mwc-button>
                      <mwc-button raised @click="${() => this._deleteTask(task)}">
                        Delete
                      </mwc-button>
                    </div>
                  </div>
                  <div class="task-info">
                    Last Done: ${attr.last_done ? attr.last_done : 'Never'}<br />
                    Due in: ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}<br />
                    State: ${task.state}
                  </div>
                </div>
              `;
            })}
      </ha-card>
    `;
  }
}

customElements.define('tasker-task-list-card', TaskerTaskListCard);
console.log('tasker-task-list-card registered', customElements.get('tasker-task-list-card'));
