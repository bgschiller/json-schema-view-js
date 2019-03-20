'use strict';

import JSONFormatter from 'json-formatter-js';
import {
  convertXOf,
  _if,
  forEachProperty,
  liftAllOf,
} from './helpers.js';

/**
 * @class JSONSchemaView
 *
 * A pure JavaScript component for rendering JSON Schema in HTML.
*/
export default class JSONSchemaView {

  /**
   * @param {object} schema The JSON Schema object
   *
   * @param {number} [open=1] his number indicates up to how many levels the
   * rendered tree should expand. Set it to `0` to make the whole tree collapsed
   * or set it to `Infinity` to expand the tree deeply
   * @param {object} options.
   *  theme {string}: one of the following options: ['dark']
  */
  constructor(schema, open, options = {theme: null}) {
    this.schema = liftAllOf(JSON.parse(JSON.stringify(schema)));
    this.open = open;
    this.options = options;
    this.isCollapsed = open <= 0;

    // if schema is an empty object which means any JSON
    this.isAny = typeof schema === 'object' &&
      !Array.isArray(schema) &&
      !Object.keys(schema)
      .filter(k=> ['title', 'description'].indexOf(k) === -1).length;

    // Determine if a schema is an array
    this.isArray = !this.isAny && this.schema && this.schema.type === 'array';

    this.isTuple = this.isArray && Array.isArray(this.schema.items);

    this.isObject = this.schema &&
      (this.schema.type === 'object' ||
       this.schema.properties ||
       this.schema.anyOf ||
       this.schema.oneOf ||
       this.schema.allOf);

    // Determine if a schema is a primitive
    this.isPrimitive = !this.isAny && !this.isArray && !this.isObject;

    //
    this.showToggle = this.schema.description ||
      this.schema.title ||
      (this.isPrimitive && (
        this.schema.minimum ||
        this.schema.maximum ||
        this.schema.exclusiveMinimum ||
        this.schema.exclusiveMaximum ||
        this.schema.format ||
        this.schema.default ||
        this.schema.minLength ||
        this.schema.maxLength ||
        this.schema.pattern ||
        this.schema.enum)
      );

    // populate isRequired property down to properties
    if (this.schema && Array.isArray(this.schema.required)) {
      forEachProperty(this.schema, (property, name) => {
        if (!this.schema.required.includes(name) || typeof property !== 'object') return;
        property.isRequired = true;
      });
    }

    // When schema represents an array, items is a list, and additionalItems is false,
    // set maxItems to the length of the items list.
    if (
      this.isTuple &&
      this.schema.additionalItems === false &&
      !("maxItems" in this.schema)
    ) {
      this.schema.maxItems = this.schema.items.length;
    }

    // try and guess the type, if it's primitive and all the same
    if (this.schema.enum && !this.schema.type) {
      const allNum = this.schema.enum.every(v => typeof v === 'number');
      const allStr = this.schema.enum.every(v => typeof v === 'string');
      if (allNum) {
        this.schema.type = 'number';
      }
      if (allStr) {
        this.schema.type = 'string';
      }
    }
  }

  /*
   * Returns the template with populated properties.
   * This template does not have the children
  */
  template() {
    if (!this.schema) {
      return '';
    }

    return `
      <!-- Any -->
      ${_if(this.isAny)`
        <div class="any">
          ${_if(this.showToggle)`
            <a class="title"><span class="toggle-handle"></span>${this.schema.title || ''} </a>
          `}

          <span class="type type-any">&lt;any&gt;</span>

          ${_if(this.schema.description && !this.isCollapsed)`
            <div class="inner description">${this.schema.description}</div>
          `}
        </div>
      `}

      <!-- Primitive -->
      ${_if(this.isPrimitive)`
        <div class="primitive">
          ${_if(this.showToggle)`
            <a class="title"><span class="toggle-handle"></span>${this.schema.title || ''} </a>
          `}

            <span class="type">${this.schema.type}</span>

          ${_if(this.schema.isRequired)`
            <span class="required">*</span>
          `}

          ${_if(!this.isCollapsed && this.schema.format)`
            <span class="format">(${this.schema.format})</span>
          `}

          ${_if(!this.isCollapsed && this.schema.default)`
            <span class="default">default: ${this.schema.default}</span>
          `}

          ${_if(!this.isCollapsed && this.schema.minimum)`
            <span class="range minimum">minimum:${this.schema.minimum}</span>
          `}

          ${_if(!this.isCollapsed && this.schema.exclusiveMinimum)`
            <span class="range exclusiveMinimum">(ex)minimum:${this.schema.exclusiveMinimum}</span>
          `}

          ${_if(!this.isCollapsed && this.schema.maximum)`
            <span class="range maximum">maximum:${this.schema.maximum}</span>
          `}

          ${_if(!this.isCollapsed && this.schema.exclusiveMaximum)`
            <span class="range exclusiveMaximum">(ex)maximum:${this.schema.exclusiveMaximum}</span>
          `}

          ${_if(!this.isCollapsed && this.schema.minLength)`
            <span class="range minLength">minLength:${this.schema.minLength}</span>
          `}

          ${_if(!this.isCollapsed && this.schema.maxLength)`
            <span class="range maxLength">maxLength:${this.schema.maxLength}</span>
          `}

           ${_if(!this.isCollapsed && this.schema.pattern)`
            <span class="pattern">pattern:${this.schema.pattern}</span>
          `}

          ${_if(this.schema.description && !this.isCollapsed)`
            <div class="inner description">${this.schema.description}</div>
          `}

          ${_if(!this.isCollapsed && this.schema.enum)`
            ${this.enum(this.schema, this.isCollapsed, this.open)}
          `}

          ${_if(this.schema.allOf && !this.isCollapsed)`${this.xOf(this.schema, 'allOf')}`}
          ${_if(this.schema.oneOf && !this.isCollapsed)`${this.xOf(this.schema, 'oneOf')}`}
          ${_if(this.schema.anyOf && !this.isCollapsed)`${this.xOf(this.schema, 'anyOf')}`}
        </div>
      `}


      <!-- Array -->
      ${_if(this.isArray)`
        <div class="array">
          <a class="title"><span class="toggle-handle"></span>${this.schema.title || ''}<span class="opening bracket">[</span>${_if(this.isCollapsed)`<span class="closing bracket">]</span>`}</a>
          ${_if(!this.isCollapsed && (this.schema.uniqueItems || this.schema.minItems || this.schema.maxItems))`
          <span>
            <span title="items range">(${this.schema.minItems || 0}..${this.schema.maxItems || '∞'})</span>
            ${_if(!this.isCollapsed && this.schema.uniqueItems)`<span title="unique" class="uniqueItems">♦</span>`}
          </span>
          `}
          <div class="inner">
            ${_if(!this.isCollapsed && this.schema.description)`
              <div class="description">${this.schema.description}</div>
            `}
          </div>

          ${_if(!this.isCollapsed && this.schema.enum)`
            ${this.enum(this.schema, this.isCollapsed, this.open)}
          `}

          ${_if(this.schema.allOf && !this.isCollapsed)`${this.xOf(this.schema, 'allOf')}`}
          ${_if(this.schema.oneOf && !this.isCollapsed)`${this.xOf(this.schema, 'oneOf')}`}
          ${_if(this.schema.anyOf && !this.isCollapsed)`${this.xOf(this.schema, 'anyOf')}`}

          ${_if(!this.isCollapsed)`
          <span class="closing bracket">]</span>
          `}
        </div>
      `}

      <!-- Object -->
      ${_if(!this.isPrimitive && !this.isArray && !this.isAny)`
        <div class="object">
          <a class="title"><span
            class="toggle-handle"></span>${this.schema.title || ''} <span
            class="opening brace">{</span>${_if(this.isCollapsed)`
              <span class="closing brace" ng-if="isCollapsed">}</span>
          `}</a>

          <div class="inner">
            ${_if(!this.isCollapsed && this.schema.description)`
              <div class="description">${this.schema.description}</div>
            `}
            <!-- children go here -->
          </div>

          ${_if(!this.isCollapsed && this.schema.enum)`
            ${this.enum(this.schema, this.isCollapsed, this.open)}
          `}

          ${_if(this.schema.allOf && !this.isCollapsed)`${this.xOf(this.schema, 'allOf')}`}
          ${_if(this.schema.oneOf && !this.isCollapsed)`${this.xOf(this.schema, 'oneOf')}`}
          ${_if(this.schema.anyOf && !this.isCollapsed)`${this.xOf(this.schema, 'anyOf')}`}

          ${_if(!this.isCollapsed)`
          <span class="closing brace">}</span>
          `}
        </div>
      `}
`.replace(/\s*\n/g, '\n').replace(/(<!--).+/g, '').trim();
  }

  /*
   * Template for oneOf, anyOf and allOf
  */
  xOf(schema, type) {
    return `
      <div class="inner ${type}">
        <b>${convertXOf(type)}:</b>
      </div>
    `;
  }

  /*
   * Template for enums
  */
  enum(schema, isCollapsed/*, open*/) {
    return `
      ${_if(!isCollapsed && schema.enum)`
        <div class="inner enums">
          <b>Enum:</b>
        </div>
      `}
    `;
  }

  /*
   * Toggles the 'collapsed' state
  */
  toggle() {
    this.isCollapsed = !this.isCollapsed;
    this.render();
  }

  /*
   * Renders the element and returns it
  */
  render() {
    if (!this.element) {
      this.element = document.createElement('div');
      this.element.classList.add('json-schema-view');
    }

    if (this.isCollapsed) {
      this.element.classList.add('collapsed');
    } else {
      this.element.classList.remove('collapsed');
    }

    if (this.options.theme) {
      this.element.classList.add(`json-schema-view-${this.options.theme}`);
    }

    this.element.innerHTML = this.template();

    if (!this.schema) {
      return this.element;
    }

    if (!this.isCollapsed) {
      this.appendChildren(this.element);
    }

    // add event listener for toggling
    if (this.element.querySelector('a.title')) {
      this.element.querySelector('a.title').addEventListener('click', this.toggle.bind(this));
    }
    return this.element;
  }

  /*
   * Appends children to given element based on current schema
  */
  appendChildren(element) {
    const inner = element.querySelector('.inner');

    if (!inner) {
      return;
    }

    if (this.schema.enum) {
      const formatter = new JSONFormatter(this.schema.enum, this.open - 1, this.options);
      const formatterEl = formatter.render();
      formatterEl.classList.add('inner');
      element.querySelector('.enums.inner').appendChild(formatterEl);

    }

    if (this.isTuple) {
      const tupleContainer = document.createElement('div');
      tupleContainer.classList.add('tuple');
      this.schema.items
        .map(item => new JSONSchemaView(item, this.open - 1, this.options))
        .forEach((s, ix) => {
          const inner = document.createElement('div');
          inner.classList.add('inner');
          inner.classList.add('tuple-entry');
          const index = document.createElement('span');
          index.classList.add('tuple-index');
          index.innerText = (ix + ':');
          inner.appendChild(index);
          inner.appendChild(s.render());
          tupleContainer.appendChild(inner)
        });
      inner.appendChild(tupleContainer);
    } else if (this.isArray) {
      const view = new JSONSchemaView(this.schema.items || {}, this.open - 1, this.options)
      inner.appendChild(view.render());
    }

    if (typeof this.schema.properties === 'object') {
      Object.keys(this.schema.properties).forEach(propertyName => {
        const property = this.schema.properties[propertyName];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<div class="property">
          <span class="name">${propertyName}:</span>
        </div>`;
        const view = new JSONSchemaView(property, this.open - 1, this.options);
        tempDiv.querySelector('.property').appendChild(view.render());

         inner.appendChild(tempDiv.querySelector('.property'));
      });
    }

    const appendXOf = (type) => {
      const innerAllOf = element.querySelector(`.inner.${type}`);

      this.schema[type].forEach(schema => {
        const inner = document.createElement('div');
        inner.classList.add('inner');
        const view = new JSONSchemaView(schema, this.open - 1, this.options);
        inner.appendChild(view.render());
        innerAllOf.appendChild(inner);
      });
    }
    if (this.schema.allOf) { appendXOf('allOf'); }
    if (this.schema.oneOf) { appendXOf('oneOf'); }
    if (this.schema.anyOf) { appendXOf('anyOf'); }


  }
}