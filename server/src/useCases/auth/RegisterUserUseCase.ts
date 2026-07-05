import { UserRepository } from '../../domain/repositories';
import { hashPassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';
import { AppError } from '../../utils/error.middleware';

// Use case: uma regra de negócio, uma responsabilidade, testável sem subir
// Express nem Firestore (basta injetar um UserRepository fake no construtor).
export class RegisterUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(name: string, email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new AppError(409, 'E-mail já cadastrado.');

    const passwordHash = await hashPassword(password);
    const user = await this.users.create({ name, email, passwordHash });

    const token = signToken({ userId: user.id, email: user.email });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}
