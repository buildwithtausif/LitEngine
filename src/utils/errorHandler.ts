import { Request, Response, NextFunction } from "express";

export default function getErrorMessage(error: unknown): Error | string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch((err) => {
      const message = getErrorMessage(err);
      res.status(500).json({ error: message });
    });
  };
