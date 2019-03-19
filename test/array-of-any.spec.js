import JSONSchemaView from '../src';

// per the spec:
// By default, the elements of the array may be anything at all.
// However, it’s often useful to validate the items of the array
// against some schema as well. This is done using the items,
// additionalItems, and contains keywords.
const schemaWithArray = { type: 'array' };

const itemsAreEmptySchema = { type: 'array', items: {} };
describe('render array of any', () => {
  it('doesnt crash without items key', () => {
    const s = new JSONSchemaView(schemaWithArray, Infinity);
    s.render();
  });

  it('doesnt crash with empty schema for items', () => {
    const s = new JSONSchemaView(itemsAreEmptySchema, Infinity);
    s.render();
  });
});