/**
 * Async wrapper to avoid try-catch blocks in route handlers
 * @param fn - Async route handler function
 */

import { NextFunction, Request, Response } from "express";

const AsyncHandler = (requestHandler: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

export { AsyncHandler };
