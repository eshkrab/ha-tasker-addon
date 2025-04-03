import { LitElement, html, css } from 'lit';
import '@material/mwc-button'; 

class TaskerSimpleCard extends LitElement {
  static get styles() {
    return css`
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
    `;
  }

  constructor() {
    super();
  }

  render() {
    return html`
      <ha-card header="Tasker Simple Card">
        <div class="card-content">
          <h1>Hello from Tasker!</h1>
          <p>This is a minimal custom card.</p>
          <mwc-button raised @click="${this._handleClick}">Test Service</mwc-button>
        </div>
      </ha-card>
    `;
  }

  _handleClick() {
    // Dispatch a service call event to Home Assistant.
    this.dispatchEvent(new CustomEvent('hass-call-service', {
      detail: {
        domain: 'tasker',
        service: 'add_task',
        serviceData: {
          friendly_name: 'Test Task',
          description: 'This is a test task from the simple card',
          start_date: new Date().toISOString().split('T')[0],
          recurring: false,
          alert: false,
        }
      },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('tasker-simple-card', TaskerSimpleCard);
