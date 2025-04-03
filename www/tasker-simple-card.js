import{LitElement as e,css as t,html as a}from"lit";class s extends e{static styles=t`
    :host {
      display: block;
      padding: 16px;
    }
    ha-card {
      padding: 16px;
      margin: 8px;
    }
    h1 {
      margin: 0;
      font-size: 24px;
    }
    p {
      margin: 8px 0;
    }
    mwc-button {
      margin-top: 12px;
    }
  `;constructor(){super(),this.friendlyName=""}render(){return a`
      <ha-card header="Tasker Simple Card">
        <div class="card-content">
          <h1>Hello from Tasker!</h1>
          <p>This is a minimal custom card.</p>
          <mwc-button raised @click="${this._handleClick}">
            Test Service
          </mwc-button>
        </div>
      </ha-card>
    `}_handleClick(){this.dispatchEvent(new CustomEvent("hass-call-service",{detail:{domain:"tasker",service:"add_task",serviceData:{friendly_name:"Test Task",description:"This is a test task from the simple card",start_date:(new Date).toISOString().split("T")[0],recurring:!1,alert:!1}},bubbles:!0,composed:!0}))}}customElements.define("tasker-simple-card",s);
