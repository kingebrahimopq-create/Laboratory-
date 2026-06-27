import { supabase } from './supabase';

export function collection(db: any, path: string) {
  if (typeof db === 'string') return { table: db };
  if (db && db.table) return { table: db.table + '/' + path }; // nested collections
  return { table: path };
}

export function doc(db: any, path: string, id?: string) {
  if (id === undefined) {
    // doc(collectionRef, id) pattern
    return { table: db.table, id: path };
  }
  // doc(db, collectionName, id) pattern
  return { table: path, id: id };
}

function convertDates(data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) return data.map(convertDates);
  if (typeof data === 'object') {
    const newData: any = {};
    for (let key in data) {
      const value = data[key];
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          newData[key] = new Timestamp(Math.floor(date.getTime() / 1000), 0);
          continue;
        }
      }
      newData[key] = convertDates(value);
    }
    return newData;
  }
  return data;
}

export async function addDoc(collectionRef: any, data: any) {
  const id = data.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
  const { data: result, error } = await supabase.from(collectionRef.table).insert({ ...data, id }).select().maybeSingle();
  if (error) { 
    console.error(`insert error in ${collectionRef.table}:`, error); 
    throw error; 
  }
  return { id: result?.id || id };
}

export async function setDoc(docRef: any, data: any, options?: { merge: boolean }) {
  const { data: result, error } = await supabase.from(docRef.table).upsert({ id: docRef.id, ...data }).select().maybeSingle();
  if (error) { console.error('setDoc error', error); throw error; }
  return result || { id: docRef.id, ...data };
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
  if (!docRef || !docRef.table || !docRef.id) {
    console.warn('getDoc: Invalid docRef', docRef);
    return { exists: () => false, data: () => null, id: null };
  }
  try {
    const { data, error } = await supabase.from(docRef.table).select().eq('id', docRef.id).maybeSingle();
    if (error) { 
      console.warn(`getDoc error in ${docRef.table} for id ${docRef.id}:`, error);
      return { exists: () => false, data: () => null, id: docRef.id };
    }
    const processedData = convertDates(data);
    return {
      exists: () => !!data,
      data: () => processedData,
      id: docRef.id
    };
  } catch (e) {
    console.error(`getDoc exception in ${docRef.table} for id ${docRef.id}:`, e);
    return { exists: () => false, data: () => null, id: docRef.id };
  }
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
  if (!queryRef) return { empty: true, docs: [], forEach: () => {} };
  
  const table = queryRef.table || queryRef.path || (typeof queryRef === 'string' ? queryRef : null);
  if (!table) {
    console.warn('getDocs: Could not determine table name from queryRef', queryRef);
    return { empty: true, docs: [], forEach: () => {} };
  }

  let req: any = supabase.from(table).select();
  
  if (queryRef.clauses) {
    for (let c of queryRef.clauses) {
      if (c.field) {
        if (c.op === '==' || c.op === '===') req = req.eq(c.field, c.value);
        else if (c.op === '>') req = req.gt(c.field, c.value);
        else if (c.op === '<') req = req.lt(c.field, c.value);
        else if (c.op === '>=') req = req.gte(c.field, c.value);
        else if (c.op === '<=') req = req.lte(c.field, c.value);
        else if (c.op === 'array-contains') req = req.contains(c.field, [c.value]);
        else if (c.op === 'in') req = req.in(c.field, c.value);
      }
      if (c.orderBy) {
        req = req.order(c.orderBy, { ascending: c.direction === 'asc' });
      }
      if (c.limit) {
        req = req.limit(c.limit);
      }
    }
  }

  try {
    const { data, error } = await req;
    if (error) { console.error('getDocs error', error); throw error; }
    
    return {
      empty: !data || data.length === 0,
      docs: (data || []).map((d: any) => {
        const processed = convertDates(d);
        return {
          id: d.id,
          data: () => processed
        };
      }),
      forEach: (cb: any) => {
        (data || []).forEach((d: any) => {
          const processed = convertDates(d);
          cb({ id: d.id, data: () => processed });
        });
      }
    };
  } catch (e) {
    console.error('getDocs exception', e);
    return { empty: true, docs: [], forEach: () => {} };
  }
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
