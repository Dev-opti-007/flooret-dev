if (!customElements.get('recipient-form')) {
  customElements.define(
    'recipient-form',
    class RecipientForm extends HTMLElement {
      constructor() {
        super();
        
        this.initializeElements();
        this.initializeState();
        this.bindEvents();
        this.onChange();
      }

      // Class properties for unsubscribers
      #cartUpdateUnsubscriber = null;
      #variantChangeUnsubscriber = null;
      #cartErrorUnsubscriber = null;

      initializeElements() {
        const sectionId = this.dataset.sectionId;
        
        this.recipientFieldsLiveRegion = this.querySelector(`#Recipient-fields-live-region-${sectionId}`);
        this.checkboxInput = this.querySelector(`#Recipient-checkbox-${sectionId}`);
        this.hiddenControlField = this.querySelector(`#Recipient-control-${sectionId}`);
        this.emailInput = this.querySelector(`#Recipient-email-${sectionId}`);
        this.nameInput = this.querySelector(`#Recipient-name-${sectionId}`);
        this.messageInput = this.querySelector(`#Recipient-message-${sectionId}`);
        this.sendonInput = this.querySelector(`#Recipient-send-on-${sectionId}`);
        this.offsetProperty = this.querySelector(`#Recipient-timezone-offset-${sectionId}`);
        
        // Initialize offset if exists
        if (this.offsetProperty) {
          this.offsetProperty.value = new Date().getTimezoneOffset().toString();
        }
      }

      initializeState() {
        this.checkboxInput.disabled = false;
        this.hiddenControlField.disabled = true;
        
        this.errorMessageWrapper = this.querySelector('.product-form__recipient-error-message-wrapper');
        this.errorMessageList = this.errorMessageWrapper?.querySelector('ul');
        this.errorMessage = this.errorMessageWrapper?.querySelector('.error-message');
        this.defaultErrorHeader = this.errorMessage?.innerText;
        this.currentProductVariantId = this.dataset.productVariantId;
      }

      bindEvents() {
        this.addEventListener('change', this.onChange.bind(this));
      }

      connectedCallback() {
        this.#setupEventSubscriptions();
      }

      disconnectedCallback() {
        this.#cleanupEventSubscriptions();
      }

      #setupEventSubscriptions() {
        this.#cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
          if (event.source === 'product-form' && event.productVariantId.toString() === this.currentProductVariantId) {
            this.resetRecipientForm();
          }
        });

        this.#variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          if (event.data.sectionId === this.dataset.sectionId) {
            this.currentProductVariantId = event.data.variant.id.toString();
          }
        });

        this.#cartErrorUnsubscriber = subscribe(PUB_SUB_EVENTS.cartError, (event) => {
          if (event.source === 'product-form' && event.productVariantId.toString() === this.currentProductVariantId) {
            this.displayErrorMessage(event.message, event.errors);
          }
        });
      }

      #cleanupEventSubscriptions() {
        [this.#cartUpdateUnsubscriber, this.#variantChangeUnsubscriber, this.#cartErrorUnsubscriber]
          .forEach(unsubscriber => unsubscriber?.());
      }

      onChange() {
        if (this.checkboxInput.checked) {
          this.enableInputFields();
          this.recipientFieldsLiveRegion.innerText = window.accessibilityStrings.recipientFormExpanded;
        } else {
          this.clearInputFields();
          this.disableInputFields();
          this.clearErrorMessage();
          this.recipientFieldsLiveRegion.innerText = window.accessibilityStrings.recipientFormCollapsed;
        }
      }

      get inputFields() {
        return [this.emailInput, this.nameInput, this.messageInput, this.sendonInput];
      }

      get disableableFields() {
        return [...this.inputFields, this.offsetProperty].filter(Boolean);
      }

      clearInputFields() {
        this.inputFields.forEach(field => field.value = '');
      }

      enableInputFields() {
        this.disableableFields.forEach(field => field.disabled = false);
      }

      disableInputFields() {
        this.disableableFields.forEach(field => field.disabled = true);
      }

      displayErrorMessage(title, body) {
        this.clearErrorMessage();
        this.errorMessageWrapper.hidden = false;

        if (typeof body === 'object') {
          this.errorMessage.innerText = this.defaultErrorHeader;
          
          Object.entries(body).forEach(([key, value]) => {
            this.#handleFieldError(key, value);
          });
          return;
        }

        this.errorMessage.innerText = body;
      }

      #handleFieldError(key, value) {
        const sectionId = this.dataset.sectionId;
        const errorMessageId = `RecipientForm-${key}-error-${sectionId}`;
        const fieldSelector = `#Recipient-${key}-${sectionId}`;
        const message = value.join(', ');

        const errorMessageElement = this.querySelector(`#${errorMessageId}`);
        const errorTextElement = errorMessageElement?.querySelector('.error-message');
        
        if (!errorTextElement) return;

        // Add to error list if exists
        if (this.errorMessageList) {
          this.errorMessageList.appendChild(this.#createErrorListItem(fieldSelector, message));
        }

        errorTextElement.innerText = `${message}.`;
        errorMessageElement.classList.remove('hidden');

        // Mark input as invalid
        const inputElement = this[`${key}Input`];
        if (inputElement) {
          inputElement.setAttribute('aria-invalid', 'true');
          inputElement.setAttribute('aria-describedby', errorMessageId);
        }
      }

      #createErrorListItem(target, message) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = target;
        a.innerText = message;
        li.className = 'error-message';
        li.appendChild(a);
        return li;
      }

      clearErrorMessage() {
        this.errorMessageWrapper.hidden = true;
        this.errorMessageList.innerHTML = '';

        // Clear all field error messages
        this.querySelectorAll('.recipient-fields .form__message').forEach(field => {
          field.classList.add('hidden');
          const textField = field.querySelector('.error-message');
          textField.innerText = '';
        });

        // Clear ARIA attributes
        this.inputFields.forEach(inputElement => {
          inputElement.setAttribute('aria-invalid', 'false');
          inputElement.removeAttribute('aria-describedby');
        });
      }

      resetRecipientForm() {
        if (this.checkboxInput.checked) {
          this.checkboxInput.checked = false;
          this.clearInputFields();
          this.clearErrorMessage();
        }
      }
    }
  );
}
