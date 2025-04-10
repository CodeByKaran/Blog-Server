// src/utils/errorHandler.ts

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError, errorResponse } from './apiResponse';
import Logger from './logger';

/**
 * Global error handler middleware for Express
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error | ApiError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  // Default status code and message
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;
  
  // If this is our custom API error, use its properties
  if ('statusCode' in err && 'isOperational' in err) {
    statusCode = (err as ApiError).statusCode;
    message = err.message;
    isOperational = (err as ApiError).isOperational;
  } else if (err.name === 'ValidationError') {
    // Handle validation errors (e.g., from a validation library)
    statusCode = 400;
    message = err.message;
    isOperational = true;
  } else if (err.name === 'UnauthorizedError') {
    // Handle authentication errors
    statusCode = 401;
    message = 'Unauthorized access';
    isOperational = true;
  }

  // Log errors appropriately
  if (isOperational) {
    // Expected errors - log at warn level
    Logger.warn(`Operational error: ${err.message}`);
  } else {
    // Unexpected errors - log at error level with stack trace
    Logger.error(`Unhandled error: ${err.message}`, err.stack);
  }

  // Send standardized error response
   res
    .status(statusCode)
    .json(errorResponse(message, statusCode, process.env.NODE_ENV === 'production' ? undefined : err.stack));
};



/**
 * Not found error handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new ApiError(`Not Found - ${req.originalUrl}`, 404);
  next(err);
};