import { Request, Response, NextFunction } from 'express';
import { container } from '../container';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body;
    res.status(201).json(await container.registerUser.execute(name, email, password));
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    res.json(await container.loginUser.execute(email, password));
  } catch (err) {
    next(err);
  }
}
