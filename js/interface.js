"use strict";
var GUI;
(function (GUI) {
    function defaultStringFormat(str) {
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
    function defaultNumberFormat(n) {
        return n.toFixed(0);
    }
    /**
     * A custom field element.
     * @param {string} label The text of the associated label
     * @param value The initial value of the field element. Depending on its type, the field will turn into slider or a dropdown list.
     * @param settings Visual settings
     */
    class CustomField extends HTMLElement {
        constructor(label, value, settings) {
            var _a, _b, _c, _d, _e, _f, _g;
            super();
            this.label = label;
            this.settings = settings;
            this._value = value;
            // Create a shadow root
            this.attachShadow({ mode: "open" });
            // Add a stylesheed
            const linkElement = document.createElement("link");
            linkElement.rel = "stylesheet";
            linkElement.href = "../css/field.css";
            (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.appendChild(linkElement);
            let wrapper = document.createElement("div");
            if (typeof value === "number") {
                // Create HTML Elements
                let labelElement = document.createElement("label");
                this.inputElement = document.createElement("input");
                this.spanElement = document.createElement("span");
                // Define the default settings
                let field = settings;
                let min = (_b = field.min) !== null && _b !== void 0 ? _b : Math.min(-5, value * 2);
                let max = (_c = field.max) !== null && _c !== void 0 ? _c : Math.max(+5, value * 2);
                let step = (_d = field.step) !== null && _d !== void 0 ? _d : 0.1;
                this.numberFormat = (_e = field.format) !== null && _e !== void 0 ? _e : defaultNumberFormat;
                // Setup the label field
                labelElement.textContent = label;
                // Setup the input field
                this.inputElement.type = "range";
                this.inputElement.value = value.toString();
                this.inputElement.min = min.toString();
                this.inputElement.max = max.toString();
                this.inputElement.step = step.toString();
                // Setup the span field
                this.spanElement.textContent = this.numberFormat(value);
                // On input event
                this.inputElement.oninput = (ev) => {
                    value = parseFloat(ev.target.value);
                    this._value = value;
                    if (this.spanElement && this.numberFormat)
                        this.spanElement.textContent = this.numberFormat(value);
                    let event = new Event("input");
                    this.dispatchEvent(event);
                };
                // Append children
                wrapper.append(labelElement, this.inputElement, this.spanElement);
            }
            else if (typeof value === "string") {
                // Create HTML Elements
                let labelElement = document.createElement("label");
                let selectElement = document.createElement("select");
                // Define the default settings
                let field = settings;
                let options = field.options;
                let format = (_f = field.format) !== null && _f !== void 0 ? _f : defaultStringFormat;
                // Setup the label field
                labelElement.textContent = label;
                // Setup the options field
                for (const option of field.options) {
                    let optionElement = document.createElement("option");
                    optionElement.value = option;
                    optionElement.selected = option == value;
                    optionElement.textContent = format(option);
                    selectElement.appendChild(optionElement);
                }
                // On input event
                selectElement.onchange = () => {
                    this.value = selectElement.value;
                    let event = new Event("input");
                    this.dispatchEvent(event);
                };
                // Append children
                wrapper.append(labelElement, selectElement);
            }
            else {
                throw TypeError(`Unsupported type '${typeof value}'.`);
            }
            // Finally, ...
            (_g = this.shadowRoot) === null || _g === void 0 ? void 0 : _g.appendChild(wrapper);
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value;
            if (typeof value === "number") {
                if (this.inputElement)
                    this.inputElement.value = value.toString();
                if (this.spanElement && this.numberFormat)
                    this.spanElement.textContent = this.numberFormat(value);
            }
        }
    }
    GUI.CustomField = CustomField;
    /**
     * A custom fieldset element.
     * @param {string} label The name of the fieldset element.
     * @param {object} object The object to be converted to a fieldset.
     * @param {FieldsetSettings} settings The associated field settings that will be passed to the CustomField constructor.
     */
    class CustomFieldset extends HTMLElement {
        constructor(label, object, settings = {}) {
            var _a, _b;
            super();
            // Create a shadow root
            this.attachShadow({ mode: "open" });
            // Add a stylesheet
            const linkElement = document.createElement("link");
            linkElement.rel = "stylesheet";
            linkElement.href = "../css/fieldset.css";
            (_a = this.shadowRoot) === null || _a === void 0 ? void 0 : _a.appendChild(linkElement);
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
            let fieldsObject;
            if (object.fields === undefined) {
                fieldsObject = {};
                Object.defineProperty(object, "fields", {
                    value: fieldsObject,
                    enumerable: false,
                    writable: false,
                });
            }
            else {
                fieldsObject = object["fields"];
            }
            // Setup custom fields
            for (const key in object) {
                if (!settings[key])
                    throw `Missing key '${key}' from fieldset settings.`;
                let field = new CustomField(defaultStringFormat(key) + ":", object[key], settings[key]);
                if (fieldsObject[key] === undefined) {
                    Object.defineProperty(fieldsObject, key, {
                        value: [field],
                        enumerable: false,
                        writable: true,
                    });
                }
                else {
                    fieldsObject[key].push(field);
                    Object.defineProperty(object, key, {
                        set: (value) => {
                            console.log("New value: " + value);
                            console.log(object);
                            fieldsObject[key].forEach((field) => (field.value = value));
                        },
                        get: () => field.value,
                    });
                }
                field.oninput = () => {
                    object[key] = field.value;
                };
                fieldsElement.appendChild(field);
            }
            // Set css variables
            fieldsElement.style.setProperty("--fieldcount", fieldsElement.children.length.toString());
            // Append children
            wrapper.append(legendElement, toggleElement, fieldsElement);
            (_b = this.shadowRoot) === null || _b === void 0 ? void 0 : _b.appendChild(wrapper);
        }
    }
    GUI.CustomFieldset = CustomFieldset;
    customElements.define("custom-field", CustomField);
    customElements.define("custom-fieldset", CustomFieldset);
})(GUI || (GUI = {}));
