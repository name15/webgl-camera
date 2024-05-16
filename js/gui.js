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
        constructor(label, value, settings = {}) {
            var _a, _b, _c, _d, _e, _f;
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
            // Create a wrapper element
            let wrapper = document.createElement("div");
            // Setup a label element
            let labelElement = document.createElement("label");
            labelElement.textContent = label;
            wrapper.appendChild(labelElement);
            if (typeof value === "number") {
                // Define the default settings
                let field = settings;
                let min = (_b = field.min) !== null && _b !== void 0 ? _b : Math.min(-5, value * 2);
                let max = (_c = field.max) !== null && _c !== void 0 ? _c : Math.max(+5, value * 2);
                let step = (_d = field.step) !== null && _d !== void 0 ? _d : 0.1;
                this.numberFormat = (_e = field.format) !== null && _e !== void 0 ? _e : defaultNumberFormat;
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
                this.inputElement.oninput = (ev) => {
                    value = parseFloat(ev.target.value);
                    this._value = value;
                    console.log("Input event");
                    this.spanElement.textContent = this.numberFormat(value);
                    let event = new Event("input");
                    this.dispatchEvent(event);
                };
                // Append children
                wrapper.append(this.inputElement, this.spanElement);
            }
            else if (typeof value === "string") {
                // Define the default settings
                let field = settings;
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
                    this.selectElement.onchange = (ev) => {
                        value = ev.target.value;
                        this._value = value;
                        let event = new Event("input");
                        this.dispatchEvent(event);
                    };
                    // Append the select element
                    wrapper.appendChild(this.selectElement);
                }
                else {
                    // Create an input element
                    this.inputElement = document.createElement("input");
                    this.inputElement.type = "text";
                    this.inputElement.value = value;
                    // On input event
                    this.inputElement.onchange = (ev) => {
                        value = ev.target.value;
                        this._value = value;
                        let event = new Event("input");
                        this.dispatchEvent(event);
                    };
                    // Append the input element
                    wrapper.appendChild(this.inputElement);
                }
            }
            else {
                throw TypeError(`Unsupported type '${typeof value}'.`);
            }
            // Finally, ...
            (_f = this.shadowRoot) === null || _f === void 0 ? void 0 : _f.appendChild(wrapper);
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value;
            if (typeof value === "number") {
                this.inputElement.value = value.toString();
                this.spanElement.textContent = this.numberFormat(value);
            }
            else if (typeof value === "string") {
                this.selectElement.value = value;
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
                let field = new CustomField(defaultStringFormat(key) + ":", object[key], settings[key] // TODO
                );
                if (fieldsObject[key] === undefined) {
                    Object.defineProperty(fieldsObject, key, {
                        value: [field],
                        enumerable: false,
                        writable: true,
                    });
                    Object.defineProperty(object, key, {
                        set: (value) => fieldsObject[key].forEach((f) => {
                            console.log(f, value);
                            if (f != field)
                                f.value = value;
                        }),
                        get: () => field.value,
                    });
                }
                else {
                    fieldsObject[key].push(field);
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
