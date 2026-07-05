import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUserUseCase } from './RegisterUserUseCase';
import { InMemoryUserRepository } from '../../infra/memory/InMemoryUserRepository';

describe('RegisterUserUseCase', () => {
  let users: InMemoryUserRepository;
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    useCase = new RegisterUserUseCase(users);
  });

  it('deve registrar um usuário com sucesso e retornar token + user (sem passwordHash)', async () => {
    const result = await useCase.execute('Maria', 'maria@email.com', 'senha123');

    expect(result.token).toBeTypeOf('string');
    expect(result.user).toEqual({ id: expect.any(String), name: 'Maria', email: 'maria@email.com' });
    expect('passwordHash' in result.user).toBe(false);
  });

  it('deve lançar erro ao tentar registrar email duplicado', async () => {
    await useCase.execute('Maria', 'maria@email.com', 'senha123');

    await expect(
      useCase.execute('Maria 2', 'maria@email.com', 'outrasenha'),
    ).rejects.toThrow('E-mail já cadastrado.');
  });
});
