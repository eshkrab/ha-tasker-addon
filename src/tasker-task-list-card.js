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
        flex-direction: row;
        justify-content: space-between;
        border-bottom: 1px solid var(--divider-color, #ccc);
        padding: 8px 0;
      }
      .task:last-child {
        border-bottom: none;
      }
      .task-name {
        font-weight: bold;
        margin-bottom: 4px;
      }
      .task-info {
        font-size: 0.9em;
        color: var(--primary-text-color, #333);
      }
    `;
  }

  constructor() {
    super();
    this.config = {};
  }

  // Home Assistant passes the hass object to the card
  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    this.config = { title: config.title || 'Task List' };
  }

  // Retrieve all task entities (assuming their entity_ids start with "tasker.")
  _getTasks() {
    if (!this._hass) return [];
    return Object.values(this._hass.states).filter(
      (state) => state.entity_id.startsWith('tasker.')
    );
  }

  // Calculate days until due (if next_due_date is provided)
  _calculateDaysUntil(due_date) {
    if (!due_date) return 'N/A';
    const today = new Date();
    const due = new Date(due_date);
    const diff = due - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  }

  render() {
    const tasks = this._getTasks();
    return html`
      <ha-card header="${this.config.title}">
        ${tasks.length === 0
          ? html`<div>No tasks available</div>`
          : tasks.map((task) => {
              const attr = task.attributes;
              const daysUntil = this._calculateDaysUntil(attr.next_due_date);
              return html`
                <div class="task">
                  <div>
                    <div class="task-name">${attr.friendly_name || 'Unnamed Task'}</div>
                    <div class="task-info">
                      Last Done: ${attr.last_done ? attr.last_done : 'Never'}
                    </div>
                  </div>
                  <div class="task-info">
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
console.log(
  'tasker-task-list-card registered',
  customElements.get('tasker-task-list-card')
);
