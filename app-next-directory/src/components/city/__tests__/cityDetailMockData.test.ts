import { mockCity, mockCityListings } from '../cityDetailMockData';
import { CityDTOSchema, ListingSummaryDTOArraySchema } from '../../../types/dto-schemas';

describe('cityDetailMockData', () => {
  it('mockCity should conform to CityDTOSchema', () => {
    const result = CityDTOSchema.safeParse(mockCity);
    expect(result.success).toBe(true);
  });

  it('mockCityListings should conform to ListingSummaryDTOArraySchema', () => {
    const result = ListingSummaryDTOArraySchema.safeParse(mockCityListings);
    expect(result.success).toBe(true);
  });
});
