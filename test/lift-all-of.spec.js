import { liftAllOf } from '../src/helpers';

describe('liftAllOf', () => {
  const coords = {
    description: "A coordinate pair",
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

  const arrayOfCoords =  {
    type: 'array',
    items: coords,
  };

  const shortLineString = {
    allOf: [
      arrayOfCoords,
      { minItems: 2 },
      { maxItems: 5 },
    ],
  }
  it('ignores schemas without allOf', () => {
    expect(liftAllOf(coords)).toBe(coords);
  });

  it('applies minItems and maxItems and flattens', () => {
    expect(liftAllOf(shortLineString))
      .toMatchObject(Object.assign({}, arrayOfCoords, {
        minItems: 2, maxItems: 5
      }));
  });
});