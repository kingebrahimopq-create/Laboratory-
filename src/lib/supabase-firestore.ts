import { supabase } from './firebase';

export function collection(db: any, path: string) {
  return { table: path };
}

export function doc(db: any, path: string, id: string) {
  return { table: path, id };
}

export async function addDoc(collectionRef: any, data: any) {
  const { data: result, error } = await supabase.from(collectionRef.table).insert(data).select().single();
  if (error) { console.error('insert error', error); throw error; }
  return { id: result.id };
}

export async function setDoc(docRef: any, data: any, options?: { merge: boolean }) {
  const { data: result, error } = await supabase.from(docRef.table).upsert({ id: docRef.id, ...data }).select().single();
  if (error) { console.error('setDoc error', error); throw error; }
  return result;
}

export async function updateDoc(docRef: any, data: any) {
  const { data: result, error } = await supabase.from(docRef.table).update(data).eq('id', docRef.id).select().single();
  if (error) { console.error('updateDoc error', error); throw error; }
  return result;
}

export async function deleteDoc(docRef: any) {
  const { error } = await supabase.from(docRef.table).delete().eq('id', docRef.id);
  if (error) { console.error('deleteDoc error', error); throw error; }
}

export async function getDoc(docRef: any) {
  const { data, error } = await supabase.from(docRef.table).select().eq('id', docRef.id).maybeSingle();
  if (error) { console.error('getDoc error', error); throw error; }
  return {
    exists: () => !!data,
    data: () => data,
    id: docRef.id
  };
}

export function query(collectionRef: any, ...clauses: any[]) {
  return { table: collectionRef.table, clauses };
}

export function where(field: string, op: string, value: any) {
  return { field, op, value };
}

export function orderBy(field: string, direction: 'asc' | 'desc' = 'asc') {
  return { orderBy: field, direction };
}

export function limit(n: number) {
  return { limit: n };
}

export async function getDocs(queryRef: any) {
  if (!queryRef.table) queryRef = { table: queryRef.table || queryRef.path || queryRef };
  let req = supabase.from(queryRef.table || queryRef).select();
  
  if (queryRef.clauses) {
    for (let c of queryRef.clauses) {
      if (c.field) {
        if (c.op === '==') req = req.eq(c.field, c.value);
        if (c.op === '>') req = req.gt(c.field, c.value);
        if (c.op === '<') req = req.lt(c.field, c.value);
        if (c.op === '>=') req = req.gte(c.field, c.value);
        if (c.op === '<=') req = req.lte(c.field, c.value);
      }
      if (c.orderBy) {
        req = req.order(c.orderBy, { ascending: c.direction === 'asc' });
      }
      if (c.limit) {
        req = req.limit(c.limit);
      }
    }
  }

  const { data, error } = await req;
  if (error) { console.error('getDocs error', error); throw error; }
  
  return {
    empty: data.length === 0,
    docs: data.map((d: any) => ({
      id: d.id,
      data: () => d
    })),
    forEach: (cb: any) => {
      data.forEach((d: any) => {
        cb({ id: d.id, data: () => d });
      });
    }
  };
}

export class Timestamp {
  seconds: number;
  nanoseconds: number;
  constructor(seconds: number, nanoseconds: number) {
    this.seconds = seconds;
    this.nanoseconds = nanoseconds;
  }
  static now() {
    return new Timestamp(Math.floor(Date.now() / 1000), 0);
  }
  toDate() {
    return new Date(this.seconds * 1000);
  }
}
