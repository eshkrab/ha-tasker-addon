import { LitElement, html, css } from 'lit';

class TaskerNewTaskCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      config: {},
      task: { type: Object },
    };
  }

  static get styles() {
    return css`
      ha-card {
        padding: 16px;
        width: 100%;
        box-sizing: border-box;
      }
      .form-row {
        margin-bottom: 16px;
      }
      ha-textfield {
        display: block;
        width: 100%;
      }
      ha-formfield {
        display: block;
        margin-bottom: 16px;
      }
      .actions {
        text-align: right;
        margin-top: 16px;
      }
    `;
  }
  

  constructor() {
    super();
    // Default task values
    this.task = {
      friendly_name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      recurring: false,
      recurrence_interval: '',
      alert: false,
    };
  }

  // Called by Home Assistant to pass in the hass object
  set hass(hass) {
    this._hass = hass;
  }

  setConfig(config) {
    // Provide a default title if none is given
    this.config = { title: config.title || 'New Task' };
  }

  _handleFriendlyName(e) {
    this.task = { ...this.task, friendly_name: e.target.value };
  }

  _handleDescription(e) {
    this.task = { ...this.task, description: e.target.value };
  }

  _handleStartDate(e) {
    this.task = { ...this.task, start_date: e.target.value };
  }

  _handleRecurring(e) {
    this.task = { ...this.task, recurring: e.target.checked };
  }

  _handleRecurrenceInterval(e) {
    // Convert to an integer if the user typed a number, or leave blank if empty
    const val = e.target.value;
    this.task = { ...this.task, recurrence_interval: val ? parseInt(val, 10) : '' };
  }

  _handleAlert(e) {
    this.task = { ...this.task, alert: e.target.checked };
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
      <ha-card .header="${this.config.title}">
        <!-- Each field is in its own .form-row for spacing -->
        <div class="form-row">
          <ha-textfield
            label="Friendly Name"
            .value="${this.task.friendly_name}"
            @input="${this._handleFriendlyName}"
          ></ha-textfield>
        </div>

        <div class="form-row">
          <ha-textfield
            label="Description"
            .value="${this.task.description}"
            @input="${this._handleDescription}"
          ></ha-textfield>
        </div>

        <div class="form-row">
          <ha-textfield
            type="date"
            label="Start Date"
            .value="${this.task.start_date}"
            @input="${this._handleStartDate}"
          ></ha-textfield>
        </div>

        <div class="form-row">
          <ha-formfield label="Recurring">
            <ha-switch
              .checked="${this.task.recurring}"
              @change="${this._handleRecurring}"
            ></ha-switch>
          </ha-formfield>
        </div>

        <div class="form-row">
          <ha-textfield
            type="number"
            label="Recurrence Interval (days)"
            .value="${this.task.recurrence_interval}"
            @input="${this._handleRecurrenceInterval}"
          ></ha-textfield>
        </div>

        <div class="form-row">
          <ha-formfield label="Alert">
            <ha-switch
              .checked="${this.task.alert}"
              @change="${this._handleAlert}"
            ></ha-switch>
          </ha-formfield>
        </div>

        <div class="actions">
          <mwc-button raised @click="${this._createOrUpdateTask}">
            ${this.task.task_id ? 'Update Task' : 'Create Task'}
          </mwc-button>
        </div>
      </ha-card>
    `;
  }
}

customElements.define('tasker-new-task-card', TaskerNewTaskCard);
console.log("tasker-new-task-card registered", customElements.get("tasker-new-task-card"));
