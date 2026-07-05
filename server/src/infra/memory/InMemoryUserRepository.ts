import { randomUUID } from 'crypto';
import { User } from '../../domain/entities';
import { UserRepository } from '../../domain/repositories';

// Implementação em memória do UserRepository: usada nos testes de use case,
// sem precisar subir Firestore nem mockar chamadas de rede.
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(u => u.email === email) ?? null;
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const user: User = { id: randomUUID(), createdAt: new Date(), ...data };
    this.users.push(user);
    return user;
  }
}
