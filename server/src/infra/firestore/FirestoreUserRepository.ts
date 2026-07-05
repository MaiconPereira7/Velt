import { Firestore } from 'firebase-admin/firestore';
import { User } from '../../domain/entities';
import { UserRepository } from '../../domain/repositories';

export class FirestoreUserRepository implements UserRepository {
  private collection;

  constructor(db: Firestore) {
    this.collection = db.collection('users');
  }

  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.collection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    return this.toEntity(snapshot.docs[0]!);
  }

  async create(data: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const createdAt = new Date();
    const docRef = await this.collection.add({ ...data, createdAt });
    return { id: docRef.id, ...data, createdAt };
  }

  private toEntity(doc: FirebaseFirestore.QueryDocumentSnapshot): User {
    const data = doc.data();
    return {
      id: doc.id,
      name: data['name'],
      email: data['email'],
      passwordHash: data['passwordHash'],
      createdAt: data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
    };
  }
}
