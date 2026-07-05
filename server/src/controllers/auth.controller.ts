import { Request, Response } from 'express';
import { container } from '../container';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) { res.status(400).json({ error: 'Campos obrigatórios: name, email, password.' }); return; }
    res.status(201).json(await container.registerUser.execute(name, email, password));
  } catch (err: any) { res.status(409).json({ error: err.message }); }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'E-mail e senha são obrigatórios.' }); return; }
    res.json(await container.loginUser.execute(email, password));
  } catch (err: any) { res.status(401).json({ error: err.message }); }
}
