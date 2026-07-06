import { Firestore } from 'firebase-admin/firestore';
import { Transaction } from '../../domain/entities';
import { TransactionRepository } from '../../domain/repositories';

export class FirestoreTransactionRepository implements TransactionRepository {
  private collection;

  constructor(db: Firestore) {
    this.collection = db.collection('transactions');
  }

  async findAllByUser(userId: string): Promise<Transaction[]> {
    // Mesmo motivo do AssetRepository: evita depender de um índice composto
    // (userId + date) que precisaria ser criado manualmente no Firebase Console.
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map(doc => this.toEntity(doc))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async findById(id: string): Promise<Transaction | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? this.toEntity(doc as FirebaseFirestore.QueryDocumentSnapshot) : null;
  }

  async create(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const createdAt = new Date();
    const docRef = await this.collection.add({ ...data, createdAt });
    return { id: docRef.id, ...data, createdAt };
  }

  async update(id: string, data: Partial<Pick<Transaction, 'description' | 'category' | 'amount' | 'date'>>): Promise<Transaction> {
    await this.collection.doc(id).update({ ...data });
    const updated = await this.findById(id);
    return updated!;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  private toEntity(doc: FirebaseFirestore.QueryDocumentSnapshot): Transaction {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data['userId'],
      type: data['type'],
      category: data['category'],
      description: data['description'],
      amount: data['amount'],
      date: data['date'],
      createdAt: data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
    };
  }
}
