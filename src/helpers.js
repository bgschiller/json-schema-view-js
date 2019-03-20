'use strict';
/*
 * Converts anyOf, allOf and oneOf to human readable string
*/
export function convertXOf(type) {
  return type.substring(0, 3) + ' of';
}

/*
 * if condition for ES6 template strings
 * to be used only in template string
 *
 * @example mystr = `Random is ${_if(Math.random() > 0.5)`greater than 0.5``
 *
 * @param {boolean} condition
 *
 * @returns {function} the template function
*/
export function _if(condition) {
  return condition ? normal : empty;
}
function empty(){
  return '';
}
function normal (template, ...expressions) {
  return template.slice(1).reduce((accumulator, part, i) => {
    return accumulator + expressions[i] + part;
  }, template[0]);
}

export function forEachProperty(schema, func) {
  const applyOnSchema = s => forEachProperty(s, func);
  if (schema.anyOf) {
    schema.anyOf.forEach(applyOnSchema);
  }
  if (schema.allOf) {
    schema.allOf.forEach(applyOnSchema);
  }
  if (schema.oneOf) {
    schema.oneOf.forEach(applyOnSchema);
  }
  if (schema.properties) {
    Object.keys(schema.properties).forEach(k => func(schema.properties[k], k));
  }
}

// MERGEABLE_PROPS = ['minItems', 'maxItems'];
export function liftAllOf(schema) {
  if (!schema.allOf) return schema;
  const merged = Object.assign({}, ...schema.allOf);
  const noConflicts = schema.allOf.every(s => Object.keys(s).every(k => !(k in s) || s[k] === merged[k]));
  if (!noConflicts) return schema;
  const newSchema = Object.assign({}, merged, schema);
  delete newSchema.allOf;
  return newSchema;
}