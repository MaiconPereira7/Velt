import { UserRepository } from '../../domain/repositories';
import { hashPassword } from '../../utils/hash';
import { signToken } from '../../utils/jwt';

// Use case: uma regra de negócio, uma responsabilidade, testável sem subir
// Express nem Firestore (basta injetar um UserRepository fake no construtor).
export class RegisterUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(name: string, email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new Error('E-mail já cadastrado.');

    const passwordHash = await hashPassword(password);
    const user = await this.users.create({ name, email, passwordHash });

    const token = signToken({ id: user.id, email: user.email, name: user.name });
    return { token, user: { id: user.id, name: user.name, email: user.email } };
  }
}
