import JSONSchemaView from '../src';

const schema = {
  description: "a schema with two required properties, both provided by all branches of a oneOf",
  required: ["area", "perimeter"],
  type: "object",
  oneOf: [
    {
      title: "circle",
      properties: {
        radius: { type: 'number' },
        area: { type: 'number' },
        perimeter: { type: 'number' },
      },
    },
    {
      title: 'square',
      properties: {
        len: { type: 'number' },
        area: { type: 'number' },
        perimeter: { type: 'number' },
      },
    }
  ],
};
const frozenSchema = JSON.parse(JSON.stringify(schema));

describe('a schema with required properties applying to all branches of the oneOf (like in geojson)', () => {
  it('doesnt crash', () => {
    const s = new JSONSchemaView(schema, Infinity);
    s.render();
  });

  it('doesnt screw with its arguments', () => {
    const s = new JSONSchemaView(schema);
    expect(frozenSchema).toMatchObject(schema);
  });

  it('bubbles isRequired to each branch', () => {
    const s = new JSONSchemaView(schema, Infinity);
    expect(s.schema.oneOf[0].properties.area.isRequired).toBe(true);
    expect(s.schema.oneOf[0].properties.perimeter.isRequired).toBe(true);
    expect(s.schema.oneOf[1].properties.area.isRequired).toBe(true);
    expect(s.schema.oneOf[1].properties.perimeter.isRequired).toBe(true);
  });

  it('still applies to direct objects', () => {
    const nestedSchema = { ...schema.oneOf[0], required: schema.required, type: 'object' };
    const s = new JSONSchemaView(nestedSchema, Infinity);
    expect(s.schema.properties.area.isRequired).toBe(true);
    expect(s.schema.properties.perimeter.isRequired).toBe(true);
    expect(s.schema.properties.radius.isRequired).toBeUndefined();
  });
});