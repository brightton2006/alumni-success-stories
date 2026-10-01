import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { broadcastDatabaseEvent } from './realtime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const UPLOADS_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Simple JSON File DB Helper for seamless out-of-the-box functionality
class JSONStore {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]), 'utf-8');
    }
  }

  read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`Error reading ${this.filePath}:`, err);
      return [];
    }
  }

  write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing ${this.filePath}:`, err);
    }
  }

  find(predicate = () => true) {
    const items = this.read();
    return items.filter(predicate);
  }

  findOne(predicate) {
    const items = this.read();
    return items.find(predicate) || null;
  }

  findById(id) {
    return this.findOne(item => (item._id === id || item.id === id));
  }

  insert(item) {
    const items = this.read();
    const id = item._id || item.id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem = {
      _id: id,
      id: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...item
    };
    items.push(newItem);
    this.write(items);
    broadcastDatabaseEvent(`${this.collectionName.toUpperCase()}_CREATED`, { collection: this.collectionName, action: 'CREATE', item: newItem });
    return newItem;
  }

  insertMany(newItems) {
    const items = this.read();
    const existingIds = new Set(items.map(i => i._id || i.id));
    let inserted = 0;
    for (const item of newItems) {
      const id = item._id || item.id || `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!existingIds.has(id)) {
        existingIds.add(id);
        items.push({
          _id: id,
          id: id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...item
        });
        inserted++;
      }
    }
    this.write(items);
    if (inserted > 0) {
      broadcastDatabaseEvent(`${this.collectionName.toUpperCase()}_BULK_UPDATED`, { collection: this.collectionName, action: 'BULK_INSERT', count: inserted });
    }
    return inserted;
  }

  count(predicate = () => true) {
    return this.find(predicate).length;
  }

  updateById(id, updates) {
    const items = this.read();
    const index = items.findIndex(item => (item._id === id || item.id === id));
    if (index === -1) return null;

    items[index] = {
      ...items[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.write(items);
    broadcastDatabaseEvent(`${this.collectionName.toUpperCase()}_UPDATED`, { collection: this.collectionName, action: 'UPDATE', item: items[index] });
    return items[index];
  }

  deleteById(id) {
    let items = this.read();
    const initialLen = items.length;
    items = items.filter(item => (item._id !== id && item.id !== id));
    if (items.length !== initialLen) {
      this.write(items);
      broadcastDatabaseEvent(`${this.collectionName.toUpperCase()}_DELETED`, { collection: this.collectionName, action: 'DELETE', id });
      return true;
    }
    return false;
  }
}

export const usersDb = new JSONStore('users');
export const storiesDb = new JSONStore('stories');
export const categoriesDb = new JSONStore('categories');
export const commentsDb = new JSONStore('comments');
export const reactionsDb = new JSONStore('reactions');

// Member Collection with MongoDB Support
let isMongoConnected = false;
let mongoMemberCollection = null;

export const initMongoConnection = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/alumni_db';
  try {
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    isMongoConnected = true;
    mongoMemberCollection = conn.connection.db.collection('members');
    console.log(`✅ MongoDB connected successfully to database: ${conn.connection.name}`);
    return true;
  } catch (err) {
    console.log(`ℹ️ MongoDB connection not active (${err.message}). Using local JSON store fallback for Members.`);
    isMongoConnected = false;
    return false;
  }
};

const jsonMembersDb = new JSONStore('members');

export const membersDb = {
  isMongo: () => isMongoConnected,

  read: () => jsonMembersDb.read(),

  find: (predicate = () => true) => jsonMembersDb.find(predicate),

  findOne: (predicate) => jsonMembersDb.findOne(predicate),

  findById: (id) => jsonMembersDb.findById(id),

  insert: (item) => jsonMembersDb.insert(item),

  insertMany: (items) => jsonMembersDb.insertMany(items),

  count: (predicate = () => true) => jsonMembersDb.count(predicate),

  updateById: (id, updates) => jsonMembersDb.updateById(id, updates),

  deleteById: (id) => jsonMembersDb.deleteById(id)
};
