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
        border-bottom: 1px solid #ddd;
        padding: 8px 0;
        display: flex;
        flex-direction: column;
      }
      .buttons {
        margin-top: 4px;
      }
      button {
        margin-right: 8px;
        padding: 4px 8px;
        font-size: 0.9em;
      }
    `;
  }

  setConfig(config) {
    if (!config.title) {
      throw new Error('You need to define a title in the config');
    }
    this.config = config;
  }

  // Get tasks from Home Assistant state (assuming your integration sets states in domain "tasker")
  getTasks() {
    if (!this.hass) return [];
    // Filter states whose entity_id starts with "tasker."
    return Object.values(this.hass.states).filter(
      (state) => state.entity_id.startsWith('tasker.')
    );
  }

  _markDone(task) {
    this.hass.callService('tasker', 'mark_task_done', { task_id: task.attributes.task_id });
  }

  _deleteTask(task) {
    this.hass.callService('tasker', 'delete_task', { task_id: task.attributes.task_id });
  }

  render() {
    const tasks = this.getTasks();
    return html`
      <ha-card header="${this.config.title}">
        ${tasks.length === 0
          ? html`<div>No tasks to display.</div>`
          : tasks.map(
              (task) => html`
                <div class="task">
                  <div>
                    <strong>${task.attributes.friendly_name}</strong> – <em>${task.state}</em>
                  </div>
                  <div class="buttons">
                    <button @click="${() => this._markDone(task)}">Mark Done</button>
                    <button @click="${() => this._deleteTask(task)}">Delete</button>
                  </div>
                </div>
              `
            )}
      </ha-card>
    `;
  }
}

customElements.define('tasker-task-list-card', TaskerTaskListCard);
