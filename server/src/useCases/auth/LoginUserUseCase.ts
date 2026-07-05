import { UserRepository } from '../../domain/repositories';
import { comparePassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';

export class LoginUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new Error('Credenciais inválidas.');

    const ok = await comparePassword(password, user.passwordHash);
    if (!ok) throw new Error('Credenciais inválidas.');

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}
