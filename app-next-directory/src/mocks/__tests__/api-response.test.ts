import { ApiResponseHandler } from '../api-response';

describe('ApiResponseHandler mock helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a success response with optional message', () => {
    const payload = { id: '123', name: 'Test Item' };
    const result = ApiResponseHandler.success(payload);

    expect(result).toEqual({ success: true, data: payload });
    expect(ApiResponseHandler.success).toHaveBeenCalledWith(payload);

    const withMessage = ApiResponseHandler.success(payload, 'Created successfully');
    expect(withMessage).toEqual({ success: true, data: payload, message: 'Created successfully' });
    expect(ApiResponseHandler.success).toHaveBeenLastCalledWith(payload, 'Created successfully');
  });

  it('creates an error response with default status code', () => {
    const errorResult = ApiResponseHandler.error('Bad Request');

    expect(errorResult).toEqual({ success: false, error: 'Bad Request', code: 400 });
    expect(ApiResponseHandler.error).toHaveBeenCalledWith('Bad Request');
  });

  it('creates an error response with a custom status code', () => {
    const errorResult = ApiResponseHandler.error('Forbidden', 403);

    expect(errorResult).toEqual({ success: false, error: 'Forbidden', code: 403 });
    expect(ApiResponseHandler.error).toHaveBeenCalledWith('Forbidden', 403);
  });

  it('creates paginated responses with derived metadata', () => {
    const items = Array.from({ length: 15 }, (_, index) => ({ index }));
    const response = ApiResponseHandler.paginated(items, 2, 5);

    expect(response).toEqual({
      data: items,
      pagination: {
        page: 2,
        limit: 5,
        total: 15,
        pages: 3,
      },
    });
    expect(ApiResponseHandler.paginated).toHaveBeenCalledWith(items, 2, 5);
  });

  it('uses defaults when pagination arguments are omitted', () => {
    const items = Array.from({ length: 12 }, (_, index) => index);
    const response = ApiResponseHandler.paginated(items);

    expect(response).toEqual({
      data: items,
      pagination: {
        page: 1,
        limit: 10,
        total: 12,
        pages: 2,
      },
    });
    expect(ApiResponseHandler.paginated).toHaveBeenCalledWith(items);
  });
});
