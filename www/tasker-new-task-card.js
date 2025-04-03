import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('tasker-new-task-card')
class TaskerNewTaskCard extends LitElement {
  static styles = css`
    ha-card {
      padding: 16px;
      margin: 8px;
    }
    .card-content {
      display: flex;
      flex-direction: column;
    }
    .card-content > div {
      margin-bottom: 12px;
    }
    label {
      display: block;
      font-weight: bold;
      margin-bottom: 4px;
    }
    input[type="text"],
    input[type="date"],
    input[type="number"] {
      width: 100%;
      padding: 4px;
      box-sizing: border-box;
    }
    .card-actions {
      text-align: right;
    }
  `;

  @state() friendlyName = '';
  @state() description = '';
  @state() startDate = '';
  @state() recurring = false;
  @state() recurrenceInterval = '';
  @state() alert = false;

  render() {
    return html`
      <ha-card header="New Task">
        <div class="card-content">
          <div>
            <label>Friendly Name</label>
            <input type="text" 
                   .value=${this.friendlyName} 
                   @input=${this._handleFriendlyName} 
                   placeholder="Enter task name" />
          </div>
          <div>
            <label>Description</label>
            <input type="text" 
                   .value=${this.description} 
                   @input=${this._handleDescription} 
                   placeholder="Enter description" />
          </div>
          <div>
            <label>Start Date</label>
            <input type="date" 
                   .value=${this.startDate} 
                   @input=${this._handleStartDate} />
          </div>
          <div>
            <label>Recurring</label>
            <input type="checkbox" 
                   .checked=${this.recurring} 
                   @change=${this._handleRecurring} />
          </div>
          <div>
            <label>Recurrence Interval (days)</label>
            <input type="number" 
                   .value=${this.recurrenceInterval} 
                   @input=${this._handleRecurrenceInterval} 
                   placeholder="E.g., 7" />
          </div>
          <div>
            <label>Alert</label>
            <input type="checkbox" 
                   .checked=${this.alert} 
                   @change=${this._handleAlert} />
          </div>
        </div>
        <div class="card-actions">
          <mwc-button raised @click=${this._createTask}>Create Task</mwc-button>
        </div>
      </ha-card>
    `;
  }

  _handleFriendlyName(e) {
    this.friendlyName = e.target.value;
  }
  _handleDescription(e) {
    this.description = e.target.value;
  }
  _handleStartDate(e) {
    this.startDate = e.target.value;
  }
  _handleRecurring(e) {
    this.recurring = e.target.checked;
  }
  _handleRecurrenceInterval(e) {
    this.recurrenceInterval = e.target.value;
  }
  _handleAlert(e) {
    this.alert = e.target.checked;
  }

  _createTask() {
    const serviceData = {
      friendly_name: this.friendlyName,
      description: this.description,
      start_date: this.startDate,
      recurring: this.recurring,
      recurrence_interval: this.recurrenceInterval ? Number(this.recurrenceInterval) : undefined,
      alert: this.alert,
    };

    // Dispatch a service call event to Home Assistant.
    this.dispatchEvent(new CustomEvent('hass-call-service', {
      detail: {
        domain: 'tasker',
        service: 'add_task',
        serviceData: serviceData,
      },
      bubbles: true,
      composed: true,
    }));

    // Optionally clear the form fields after submission.
    this.friendlyName = '';
    this.description = '';
    this.startDate = '';
    this.recurring = false;
    this.recurrenceInterval = '';
    this.alert = false;
  }
}

