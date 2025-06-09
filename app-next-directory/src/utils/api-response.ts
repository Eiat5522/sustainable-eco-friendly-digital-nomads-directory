import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any;
}

export class ApiResponseHandler {
  static success<T>(data: T, message?: string): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
      success: true,
      data,
      message
    });
  }

  static error(error: string, status: number = 400, details?: any): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error,
      ...(details && { details })
    }, { status });
  }

  static notFound(resource: string = 'Resource'): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: `${resource} not found`
    }, { status: 404 });
  }

  static unauthorized(): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'Unauthorized access'
    }, { status: 401 });
  }

  static forbidden(): NextResponse<ApiResponse> {
    return NextResponse.json({
      success: false,
      error: 'Forbidden'
    }, { status: 403 });
  }
}
