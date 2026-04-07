import { Request, Response, NextFunction } from "express";

const noLimit = (_req: Request, _res: Response, next: NextFunction): void => next();

export const authLimiter = noLimit;
export const generalLimiter = noLimit;
export const orderLimiter = noLimit;
export const uploadLimiter = noLimit;
