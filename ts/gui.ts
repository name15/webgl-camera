namespace GUI {
  function defaultStringFormat(str: string): string {
    let result;
    while ((result = /[A-Z]/.exec(str))) {
      str =
        str.slice(0, result.index) +
        " " +
        result[0].toLowerCase() +
        str.slice(result.index + 1);
    }

    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function defaultNumberFormat(n: number): string {
    return n.toFixed(0);
  }

  export interface NumberFieldSettings {
    min?: number;
    max?: number;
    step?: number;
    format?: {
      (num: number): string;
    };
  }

  export interface StringFieldSettings {
    options?: string[];
  }

  export interface FieldsetSettings {
    [key: string]: NumberFieldSettings | StringFieldSettings;
  }

  export interface FieldsetObject {
    [key: string]: number | string;
  }

  /**
   * A custom field element.
   * @param {string} label The text of the associated label
   * @param value The initial value of the field element. Depending on its type, the field will turn into slider or a dropdown list.
   * @param settings Visual settings
   */
  export class CustomField<Type extends number | string> extends HTMLElement {
    // Field properties
    private inputElement?: HTMLInputElement;
    private selectElement?: HTMLSelectElement;
    private spanElement?: HTMLSpanElement;
    private numberFormat?: (n: number) => string;

    // Value property (with its corresponding getter and setter)
    private _value: Type;

    public get value(): Type {
      return this._value;
    }

    public set value(value: Type) {
      this._value = value;

      if (typeof value === "number") {
        this.inputElement!.value = value.toString();
        this.spanElement!.textContent = this.numberFormat!(value);
      } else if (typeof value === "string") {
        this.selectElement!.value = value;
      }
    }

    constructor(
      public label: string,
      value: Type,
      public settings: Type extends number
        ? NumberFieldSettings
        : StringFieldSettings = {}
    ) {
      super();

      this._value = value;

      // Create a shadow root
      this.attachShadow({ mode: "open" });

      // Add a stylesheed
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = "../css/field.css";
      this.shadowRoot?.appendChild(linkElement);

      // Create a wrapper element
      let wrapper = document.createElement("div");

      // Setup a label element
      let labelElement = document.createElement("label");
      labelElement.textContent = label;
      wrapper.appendChild(labelElement);

      if (typeof value === "number") {
        // Define the default settings
        let field = settings as NumberFieldSettings;
        let min = field.min ?? Math.min(-5, value * 2);
        let max = field.max ?? Math.max(+5, value * 2);
        let step = field.step ?? 0.1;
        this.numberFormat = field.format ?? defaultNumberFormat;

        // Create HTML Elements
        this.inputElement = document.createElement("input");
        this.spanElement = document.createElement("span");

        // Setup the input field
        this.inputElement.type = "range";
        this.inputElement.value = value.toString();
        this.inputElement.min = min.toString();
        this.inputElement.max = max.toString();
        this.inputElement.step = step.toString();

        // Setup the span field
        this.spanElement.textContent = this.numberFormat(value);

        // On input event
        this.inputElement.oninput = (ev: Event) => {
          (value as number) = parseFloat((ev.target as HTMLInputElement).value);
          this._value = value;

          console.log("Input event");
          this.spanElement!.textContent = this.numberFormat!(value);

          let event = new Event("input");
          this.dispatchEvent(event);
        };

        // Append children
        wrapper.append(this.inputElement, this.spanElement);
      } else if (typeof value === "string") {
        // Define the default settings
        let field = settings as StringFieldSettings;

        if (field.options) {
          // Create a select element with options to choose from
          this.selectElement = document.createElement("select");

          for (const option of field.options) {
            let optionElement = document.createElement("option");
            optionElement.value = option;
            optionElement.selected = option == value;
            optionElement.textContent = option;
            this.selectElement.appendChild(optionElement);
          }

          // On input event
          this.selectElement.onchange = (ev: Event) => {
            (value as string) = (ev.target as HTMLSelectElement).value;
            this._value = value;

            let event = new Event("input");
            this.dispatchEvent(event);
          };

          // Append the select element
          wrapper.appendChild(this.selectElement);
        } else {
          // Create an input element
          this.inputElement = document.createElement("input");

          this.inputElement.type = "text";
          this.inputElement.value = value;

          // On input event
          this.inputElement.onchange = (ev: Event) => {
            (value as string) = (ev.target as HTMLInputElement).value;
            this._value = value;

            let event = new Event("input");
            this.dispatchEvent(event);
          };

          // Append the input element
          wrapper.appendChild(this.inputElement);
        }
      } else {
        throw TypeError(`Unsupported type '${typeof value}'.`);
      }

      // Finally, ...
      this.shadowRoot?.appendChild(wrapper);
    }
  }

  /**
   * A custom fieldset element.
   * @param {string} label The name of the fieldset element.
   * @param {object} object The object to be converted to a fieldset.
   * @param {FieldsetSettings} settings The associated field settings that will be passed to the CustomField constructor.
   */
  export class CustomFieldset extends HTMLElement {
    constructor(
      label: string,
      object: FieldsetObject,
      settings: FieldsetSettings = {}
    ) {
      super();

      // Create a shadow root
      this.attachShadow({ mode: "open" });

      // Add a stylesheet
      const linkElement = document.createElement("link");
      linkElement.rel = "stylesheet";
      linkElement.href = "../css/fieldset.css";
      this.shadowRoot?.appendChild(linkElement);

      // Create HTML elements
      let wrapper = document.createElement("div");
      let fieldsElement = document.createElement("div");
      let legendElement = document.createElement("legend");
      let toggleElement = document.createElement("div");

      // Setup wraper, legend, button and wrapper elements
      wrapper.className = "wrapper";
      legendElement.textContent = label;
      toggleElement.className = "toggle";
      toggleElement.onclick = () => wrapper.classList.toggle("hide");
      fieldsElement.className = "fields";

      // Setup a fields object (for storing associated custom fields)
      let fieldsObject: { [key: string]: CustomField<any>[] };
      if (object.fields === undefined) {
        fieldsObject = {};

        Object.defineProperty(object, "fields", {
          value: fieldsObject,
          enumerable: false,
          writable: false,
        });
      } else {
        fieldsObject = object["fields"] as unknown as {
          [key: string]: CustomField<any>[];
        };
      }

      // Setup custom fields
      for (const key in object) {
        let field = new CustomField(
          defaultStringFormat(key) + ":",
          object[key],
          settings[key] // TODO
        );

        if (fieldsObject[key] === undefined) {
          Object.defineProperty(fieldsObject, key, {
            value: [field],
            enumerable: false,
            writable: true,
          });

          Object.defineProperty(object, key, {
            set: (value: number | string) =>
              fieldsObject[key].forEach((f) => {
                console.log(f, value);
                if (f != field) f.value = value;
              }),
            get: () => field.value,
          });
        } else {
          fieldsObject[key].push(field);
        }

        field.oninput = () => {
          object[key] = field.value;
        };

        fieldsElement.appendChild(field);
      }

      // Set css variables
      fieldsElement.style.setProperty(
        "--fieldcount",
        fieldsElement.children.length.toString()
      );

      // Append children
      wrapper.append(legendElement, toggleElement, fieldsElement);
      this.shadowRoot?.appendChild(wrapper);
    }
  }

  customElements.define("custom-field", CustomField);
  customElements.define("custom-fieldset", CustomFieldset);
}
