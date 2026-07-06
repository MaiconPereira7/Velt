import { Firestore } from 'firebase-admin/firestore';
import { Asset } from '../../domain/entities';
import { AssetRepository } from '../../domain/repositories';

export class FirestoreAssetRepository implements AssetRepository {
  private collection;

  constructor(db: Firestore) {
    this.collection = db.collection('assets');
  }

  async findAllByUser(userId: string): Promise<Asset[]> {
    // Sem orderBy aqui de propósito: where(userId) + orderBy(createdAt) exige um
    // índice composto no Firestore que não existe por padrão (erro FAILED_PRECONDITION).
    // Pra uma coleção do tamanho da carteira de um usuário, ordenar em memória é
    // mais simples do que forçar a criação de um índice no console do Firebase.
    const snapshot = await this.collection.where('userId', '==', userId).get();
    return snapshot.docs
      .map(doc => this.toEntity(doc))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findById(id: string): Promise<Asset | null> {
    const doc = await this.collection.doc(id).get();
    return doc.exists ? this.toEntity(doc as FirebaseFirestore.QueryDocumentSnapshot) : null;
  }

  async create(data: Omit<Asset, 'id' | 'createdAt'>): Promise<Asset> {
    const createdAt = new Date();
    const docRef = await this.collection.add({ ...data, createdAt });
    return { id: docRef.id, ...data, createdAt };
  }

  async update(id: string, data: Partial<Pick<Asset, 'amount' | 'avgPrice'>>): Promise<Asset> {
    await this.collection.doc(id).update({ ...data });
    const updated = await this.findById(id);
    return updated!;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
  }

  private toEntity(doc: FirebaseFirestore.QueryDocumentSnapshot): Asset {
    const data = doc.data();
    return {
      id: doc.id,
      userId: data['userId'],
      coin: data['coin'],
      symbol: data['symbol'],
      coinId: data['coinId'],
      amount: data['amount'],
      avgPrice: data['avgPrice'],
      icon: data['icon'],
      color: data['color'],
      createdAt: data['createdAt']?.toDate?.() ?? new Date(data['createdAt']),
    };
  }
}
