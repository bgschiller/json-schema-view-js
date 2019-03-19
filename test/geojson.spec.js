import JSONSchemaView from '../src';
import geojsonSchema from './geojson-schema-dereferenced';

describe('it works on geojson', () => {
  it('doesnt crash', () => {
    const s = new JSONSchemaView(geojsonSchema);
    s.render();
  });
});