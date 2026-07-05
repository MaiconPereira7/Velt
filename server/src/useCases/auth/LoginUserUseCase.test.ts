import { describe, it, expect, beforeEach } from 'vitest';
import { RegisterUserUseCase } from './RegisterUserUseCase';
import { LoginUserUseCase } from './LoginUserUseCase';
import { InMemoryUserRepository } from '../../infra/memory/InMemoryUserRepository';

describe('LoginUserUseCase', () => {
  let users: InMemoryUserRepository;
  let loginUseCase: LoginUserUseCase;

  beforeEach(async () => {
    users = new InMemoryUserRepository();
    loginUseCase = new LoginUserUseCase(users);
    await new RegisterUserUseCase(users).execute('Maria', 'maria@email.com', 'senha123');
  });

  it('deve fazer login com credenciais corretas e retornar token + user', async () => {
    const result = await loginUseCase.execute('maria@email.com', 'senha123');

    expect(result.token).toBeTypeOf('string');
    expect(result.user.email).toBe('maria@email.com');
  });

  it('deve lançar erro com email inexistente', async () => {
    await expect(
      loginUseCase.execute('naoexiste@email.com', 'senha123'),
    ).rejects.toThrow('Credenciais inválidas.');
  });

  it('deve lançar erro com senha errada', async () => {
    await expect(
      loginUseCase.execute('maria@email.com', 'senhaerrada'),
    ).rejects.toThrow('Credenciais inválidas.');
  });
});
