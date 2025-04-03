import { LitElement, html } from 'lit';

class TaskerNewTaskCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      task: { type: Object }
    };
  }

  // Return an empty array of styles so no custom CSS is injected.
  static get styles() {
    return [];
  }

  constructor() {
    super();
    // Default values for a new task
    this.task = {
      friendly_name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      recurring: false,
      recurrence_interval: '',
      alert: false,
    };
  }

  // The hass setter is automatically called when Home Assistant passes the hass object.
  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    // Use a default title if none is provided
    this.config = { title: config.title || 'New Task' };
  }

  _handleInput(e) {
    const field = e.target.name;
    let value = e.target.value;
    if (e.target.type === 'checkbox') {
      value = e.target.checked;
    }
    this.task = { ...this.task, [field]: value };
  }

  _createOrUpdateTask() {
    console.log("Creating/updating task with:", this.task);
    if (this._hass) {
      const service = this.task.task_id ? 'update_task' : 'add_task';
      this._hass.callService('tasker', service, this.task);
    } else {
      console.error("Home Assistant instance not available");
    }
    // Clear the form after submission
    this.task = {
      friendly_name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      recurring: false,
      recurrence_interval: '',
      alert: false,
    };
  }

  render() {
    return html`
      <ha-card header="${this.config.title}">
        <div>
          <label>Friendly Name</label>
          <input type="text" name="friendly_name" .value="${this.task.friendly_name}" @input="${this._handleInput}" />
        </div>
        <div>
          <label>Description</label>
          <input type="text" name="description" .value="${this.task.description}" @input="${this._handleInput}" />
        </div>
        <div>
          <label>Start Date</label>
          <input type="date" name="start_date" .value="${this.task.start_date}" @input="${this._handleInput}" />
        </div>
        <div>
          <label>Recurring</label>
          <input type="checkbox" name="recurring" .checked="${this.task.recurring}" @change="${this._handleInput}" />
        </div>
        <div>
          <label>Recurrence Interval (days)</label>
          <input type="number" name="recurrence_interval" .value="${this.task.recurrence_interval}" @input="${this._handleInput}" />
        </div>
        <div>
          <label>Alert</label>
          <input type="checkbox" name="alert" .checked="${this.task.alert}" @change="${this._handleInput}" />
        </div>
        <div>
          <button @click="${this._createOrUpdateTask}">
            ${this.task.task_id ? 'Update Task' : 'Create Task'}
          </button>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('tasker-new-task-card', TaskerNewTaskCard);
console.log("tasker-new-task-card registered", customElements.get("tasker-new-task-card"));
