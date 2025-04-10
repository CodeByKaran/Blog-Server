// src/utils/apiResponse.ts

/**
 * Standard API response interface
 * Used to ensure consistent response structure across all endpoints
 */
export interface ApiResponse<T = any> {
    success: boolean;
    statusCode: number;
    message: string;
    data?: T;
    error?: string;
  }
  
  /**
   * Create a successful API response
   * @param data - The data to include in the response
   * @param message - Success message
   * @param statusCode - HTTP status code (default: 200)
   */
  export const successResponse = <T>(
    data: T,
    message: string = "Success",
    statusCode: number = 200
  ): ApiResponse<T> => {
    return {
      success: true,
      statusCode,
      message,
      data
    };
  };
  
  /**
   * Create an error API response
   * @param message - Error message
   * @param statusCode - HTTP status code (default: 500)
   * @param error - Optional detailed error information
   */
  export const errorResponse = (
    message: string = "Internal Server Error",
    statusCode: number = 500,
    error?: string
  ): ApiResponse => {
    return {
      success: false,
      statusCode,
      message,
      error
    };
  };
  
  /**
   * Custom error class for application-specific errors
   * Makes it easier to create and handle specific error types
   */
  export class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
  
    /**
     * Create a new API error
     * @param message - Error message
     * @param statusCode - HTTP status code
     * @param isOperational - Whether the error is operational (expected) or programming
     */
    constructor(
      message: string, 
      statusCode: number = 500, 
      isOperational: boolean = true
    ) {
      super(message);
      this.name = this.constructor.name;
      this.statusCode = statusCode;
      this.isOperational = isOperational;
      
      // Capture stack trace (excludes the constructor call)
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  /**
   * Common HTTP status codes as convenience constants
   */
  export const HttpStatus = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  };