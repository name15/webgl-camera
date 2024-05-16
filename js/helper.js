"use strict";
var GUI;
(function (GUI) {
    function createNumberField(name, field, setValue) {
        let transform = field.transform || ((s) => parseFloat(s));
        let format = field.format || ((n) => n.toString());
        let container = document.createElement("div");
        let label = document.createElement("label");
        label.textContent = name;
        let input = document.createElement("input");
        input.type = "range";
        input.value = field.value.toString();
        input.min = field.min.toString();
        input.max = field.max.toString();
        if (field.step)
            input.step = field.step.toString();
        let span = document.createElement("span");
        span.textContent = format(parseFloat(input.value));
        input.oninput = () => {
            span.textContent = format(parseFloat(input.value));
            setValue(transform(input.value));
        };
        container.append(label, input, span);
        return container;
    }
    GUI.createNumberField = createNumberField;
    function defaultStringFormat(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    function createStringField(name, field, setValue) {
        let format = field.format || defaultStringFormat;
        let container = document.createElement("div");
        let label = document.createElement("label");
        label.textContent = name;
        let select = document.createElement("select");
        for (let value of field.options) {
            let option = document.createElement("option");
            option.value = value;
            option.selected = value == field.value;
            option.textContent = format(value);
            select.appendChild(option);
        }
        select.onchange = () => setValue(select.value);
        container.append(label, select);
        return container;
    }
    GUI.createStringField = createStringField;
    function createFieldset(name, fieldObj) {
        // Shake the object tree
        let valueObj = {};
        // Get the values only
        for (let key in fieldObj) {
            valueObj[key] = fieldObj[key].value;
        }
        let fieldset = document.createElement("fieldset");
        let legend = document.createElement("legend");
        legend.textContent = name;
        fieldset.appendChild(legend);
        for (let key in fieldObj) {
            let fieldName = defaultStringFormat(key);
            let field;
            let fieldElement;
            switch (typeof valueObj[key]) {
                case "number":
                    field = fieldObj[key];
                    fieldElement = createNumberField(fieldName, field, (v) => (valueObj[key] = v));
                    break;
                case "string":
                    field = fieldObj[key];
                    fieldElement = createStringField(fieldName, field, (v) => (valueObj[key] = v));
                    break;
            }
            fieldset.appendChild(fieldElement);
        }
        return {
            element: fieldset,
            values: valueObj,
        };
    }
    GUI.createFieldset = createFieldset;
})(GUI || (GUI = {}));
