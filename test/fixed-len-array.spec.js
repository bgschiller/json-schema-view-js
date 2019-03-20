import JSONSchemaView from '../src';


describe('An array with exactly two numbers', () => {
  const schema = {
    description: "A single position",
    type: "array",
    minItems: 2,
    items: [
      {
        type: "number"
      },
      {
        type: "number"
      }
    ],
    additionalItems: false
  };
  const v = new JSONSchemaView(schema);
  const el = v.render();

  it('respects the length of items as a max len when additionalItems: false', () => {
    expect(v.schema.maxItems).toBe(2);
  });

  it('renders a tuple container', () => {
    expect(el.querySelector('.tuple')).toBeDefined();
  });

  it('creates the correct number of inner rows within the tuple', () => {
    expect(el.querySelectorAll('.tuple > .inner')).toHaveLength(2);
  });
});