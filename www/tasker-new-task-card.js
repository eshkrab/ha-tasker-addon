import{LitElement as e,css as t,html as r}from"lit";customElements.define("tasker-new-task-card",class extends e{static get styles(){return t`
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
    `}constructor(){super(),this.friendlyName="",this.description="",this.startDate="",this.recurring=!1,this.recurrenceInterval="",this.alert=!1}render(){return r`
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
    `}_handleFriendlyName(e){this.friendlyName=e.target.value}_handleDescription(e){this.description=e.target.value}_handleStartDate(e){this.startDate=e.target.value}_handleRecurring(e){this.recurring=e.target.checked}_handleRecurrenceInterval(e){this.recurrenceInterval=e.target.value}_handleAlert(e){this.alert=e.target.checked}_createTask(){const e={friendly_name:this.friendlyName,description:this.description,start_date:this.startDate,recurring:this.recurring,recurrence_interval:this.recurrenceInterval?Number(this.recurrenceInterval):void 0,alert:this.alert};this.dispatchEvent(new CustomEvent("hass-call-service",{detail:{domain:"tasker",service:"add_task",serviceData:e},bubbles:!0,composed:!0})),this.friendlyName="",this.description="",this.startDate="",this.recurring=!1,this.recurrenceInterval="",this.alert=!1}});
