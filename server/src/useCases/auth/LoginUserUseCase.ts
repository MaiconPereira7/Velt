import { UserRepository } from '../../domain/repositories';
import { comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../utils/error.middleware';

export class LoginUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new AppError(401, 'Credenciais inválidas.');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new AppError(401, 'Credenciais inválidas.');

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}
