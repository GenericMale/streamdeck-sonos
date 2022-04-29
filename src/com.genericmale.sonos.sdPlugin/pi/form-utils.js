class FormUtils {
    /**
     * Returns the value from a form using the form controls name property
     * @param {*} form
     * @returns
     */
    static getFormValue(form) {
        if (typeof form === 'string') {
            form = document.querySelector(form);
        }

        const elements = form?.elements;

        if (!elements) {
            throw 'Could not find form!';
        }

        const formData = new FormData(form);
        let formValue = {};

        formData.forEach((value, key) => {
            if (!Reflect.has(formValue, key)) {
                formValue[key] = value;
                return;
            }
            if (!Array.isArray(formValue[key])) {
                formValue[key] = [formValue[key]];
            }
            formValue[key].push(value);
        });

        return formValue;
    }

    /**
     * Sets the value of form controls using their name attribute and the jsn object key
     * @param {*} jsn
     * @param {*} form
     */
    static setFormValue(jsn, form) {
        if (typeof form === 'string') {
            form = document.querySelector(form);
        }

        const elements = form?.elements;

        if (!elements) {
            throw 'Could not find form!';
        }

        Array.from(elements)
            .filter((element) => element?.name)
            .forEach((element) => {
                const {name, type} = element;
                if (jsn.hasOwnProperty(name)) {
                    const value = jsn[name];
                    const isCheckOrRadio = type === 'checkbox' || type === 'radio';
                    if (isCheckOrRadio) {
                        const isSingle = value === element.value;
                        if (isSingle || (Array.isArray(value) && value.includes(element.value))) {
                            element.checked = true;
                        }
                    } else {
                        element.value = value ?? '';
                    }
                }
            });
    }

    /**
     * This provides a slight delay before processing rapid events
     * @param {*} wait - delay before processing function (recommended time 150ms)
     * @param {*} fn
     * @returns
     */
    static debounce(wait, fn) {
        let timeoutId = null;
        return (...args) => {
            window.clearTimeout(timeoutId);
            timeoutId = window.setTimeout(() => {
                fn.apply(null, args);
            }, wait);
        };
    }

    /**
     * Quick utility to lighten or darken a color (doesn't take color-drifting, etc. into account)
     *      Usage:
     *      fadeColor('#061261', 100); // will lighten the color
     *      fadeColor('#200867'), -100); // will darken the color
     */
    static fadeColor(col, amt) {
        const min = Math.min, max = Math.max;
        const num = parseInt(col.replace(/#/g, ''), 16);
        const r = min(255, max((num >> 16) + amt, 0));
        const g = min(255, max((num & 0x0000FF) + amt, 0));
        const b = min(255, max(((num >> 8) & 0x00FF) + amt, 0));
        return '#' + (g | (b << 8) | (r << 16)).toString(16).padStart(6, 0);
    }

    /**
     * Stream Deck software passes system-highlight color information
     * to Property Inspector. Here we 'inject' the CSS styles into the DOM
     * when we receive this information.
     */
    static addDynamicStyles(clrs) {
        const node = document.getElementById('#sdpi-dynamic-styles') || document.createElement('style');
        if (!clrs.mouseDownColor) clrs.mouseDownColor = this.fadeColor(clrs.highlightColor, -100);
        const clr = clrs.highlightColor.slice(0, 7);
        const clr1 = this.fadeColor(clr, 100);
        const clr2 = this.fadeColor(clr, 60);
        const metersActiveColor = this.fadeColor(clr, -60);

        node.setAttribute('id', 'sdpi-dynamic-styles');
        node.innerHTML = `

    input[type="radio"]:checked + label span,
    input[type="checkbox"]:checked + label span {
        background-color: ${clrs.highlightColor};
    }

    input[type="radio"]:active:checked + label span,
    input[type="radio"]:active + label span,
    input[type="checkbox"]:active:checked + label span,
    input[type="checkbox"]:active + label span {
      background-color: ${clrs.mouseDownColor};
    }

    input[type="radio"]:active + label span,
    input[type="checkbox"]:active + label span {
      background-color: ${clrs.buttonPressedBorderColor};
    }

    td.selected,
    td.selected:hover,
    li.selected:hover,
    li.selected {
      color: white;
      background-color: ${clrs.highlightColor};
    }

    .sdpi-file-label > label:active,
    .sdpi-file-label.file:active,
    label.sdpi-file-label:active,
    label.sdpi-file-info:active,
    input[type="file"]::-webkit-file-upload-button:active,
    button:active {
      background-color: ${clrs.buttonPressedBackgroundColor};
      color: ${clrs.buttonPressedTextColor};
      border-color: ${clrs.buttonPressedBorderColor};
    }

    ::-webkit-progress-value,
    meter::-webkit-meter-optimum-value {
        background: linear-gradient(${clr2}, ${clr1} 20%, ${clr} 45%, ${clr} 55%, ${clr2})
    }

    ::-webkit-progress-value:active,
    meter::-webkit-meter-optimum-value:active {
        background: linear-gradient(${clr}, ${clr2} 20%, ${metersActiveColor} 45%, ${metersActiveColor} 55%, ${clr})
    }
    `;
        document.body.appendChild(node);
    }

    /**
     * Fetches the specified language json file
     * @param pathPrefix
     * @returns {Promise<void>}
     */
    static async loadLocalization(language, pathPrefix) {
        const manifest = await this.readJson(`${pathPrefix}${language}.json`);
        const localization = manifest['Localization'] ?? null;

        if (localization) {
            const elements = document.querySelectorAll('[data-localize]');

            elements.forEach((element) => {
                element.textContent =
                    localization[element.textContent] ?? element.textContent;
            });
        }
    }

    /**
     * @private
     */
    static async readJson(path) {
        return new Promise((resolve, reject) => {
            const req = new XMLHttpRequest();
            req.onerror = reject;
            req.overrideMimeType('application/json');
            req.open('GET', path, true);
            req.onreadystatechange = (response) => {
                if (req.readyState === 4) {
                    const jsonString = response?.target?.response;
                    if (jsonString) {
                        resolve(JSON.parse(response?.target?.response));
                    } else {
                        reject();
                    }
                }
            };

            req.send();
        });
    }
}
