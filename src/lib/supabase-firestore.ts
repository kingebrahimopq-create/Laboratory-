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

const tableColumnsCache: Record<string, string[]> = {};

export async function getTableColumns(table: string): Promise<string[]> {
  if (tableColumnsCache[table]) return tableColumnsCache[table];

  // Fallbacks
  const fallbacks: Record<string, string[]> = {
    users: ['id', 'username', 'role', 'name', 'nameAr', 'phone', 'email', 'created_at'],
    patients: ['id', 'name', 'nameAr', 'email', 'phone', 'gender', 'dob', 'address', 'createdAt', 'updatedAt'],
    tests: ['id', 'patientId', 'type', 'parameters', 'results', 'status', 'assignedTo', 'isDrawn', 'drawnAt', 'drawnBy', 'drawNotes', 'insuranceProvider', 'insuranceApprovalNumber', 'discountPercentage', 'amountCollected', 'createdAt', 'updatedAt'],
    appointments: ['id', 'patientId', 'date', 'type', 'status', 'created_at'],
    home_visits: ['id', 'patientId', 'patientNameAr', 'phone', 'address', 'visitDate', 'visitTime', 'testsReq', 'status', 'phlebotomist', 'notes', 'createdAt'],
  };

  try {
    const { data: selectData, error: selectError } = await supabase.from(table).select().limit(1);
    if (!selectError && selectData && selectData.length > 0) {
      tableColumnsCache[table] = Object.keys(selectData[0]);
      return tableColumnsCache[table];
    }

    const tempId = 'temp_col_check_' + Math.random().toString(36).substring(2, 7);
    const { data: insertData, error: insertError } = await supabase.from(table).insert({ id: tempId }).select();
    if (!insertError && insertData && insertData.length > 0) {
      tableColumnsCache[table] = Object.keys(insertData[0]);
      await supabase.from(table).delete().eq('id', tempId);
      return tableColumnsCache[table];
    }
  } catch (e) {
    console.warn(`Error dynamically inspecting table ${table}:`, e);
  }

  tableColumnsCache[table] = fallbacks[table] || [];
  return tableColumnsCache[table];
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

function serializeData(data: any): any {
  if (data === null || data === undefined) return data;
  if (data instanceof Timestamp) {
    return new Date(data.seconds * 1000).toISOString();
  }
  if (data instanceof Date) {
    return data.toISOString();
  }
  if (Array.isArray(data)) {
    return data.map(serializeData);
  }
  if (typeof data === 'object') {
    const serialized: any = {};
    for (let key in data) {
      serialized[key] = serializeData(data[key]);
    }
    return serialized;
  }
  return data;
}

const catchAllColumns: Record<string, string> = {
  appointments: 'type',
  inventory: 'description',
  inventory_logs: 'reason',
  expenses: 'description',
  shifts: 'notes',
  qc: 'results',
  audit_logs: 'details',
  tests_catalog: 'descriptionAr',
};

const fieldMappingRules: Record<string, Record<string, string>> = {
  inventory_logs: {
    itemNameAr: 'itemName',
    quantityConsumed: 'amount',
    recordedBy: 'user',
    detailsAr: 'action',
  },
  expenses: {
    recordedBy: 'description',
  },
};

async function preparePayload(table: string, data: any): Promise<any> {
  const serialized = serializeData(data);
  if (!serialized) return serialized;

  const actualColumns = await getTableColumns(table);
  if (actualColumns.length === 0) {
    return serialized;
  }

  const payload: any = {};
  const extraFields: any = {};

  const rules = fieldMappingRules[table] || {};
  
  // Map timestamps specifically
  const mappedCreatedAt = actualColumns.includes('createdAt') 
    ? 'createdAt' 
    : (actualColumns.includes('created_at') ? 'created_at' : (actualColumns.includes('timestamp') ? 'timestamp' : ''));
  
  const mappedUpdatedAt = actualColumns.includes('updatedAt') 
    ? 'updatedAt' 
    : (actualColumns.includes('updated_at') ? 'updated_at' : '');

  for (let key in serialized) {
    if (key === 'id') {
      payload.id = serialized.id;
      continue;
    }

    // Check custom rules
    const ruleTarget = rules[key];
    if (ruleTarget && actualColumns.includes(ruleTarget)) {
      payload[ruleTarget] = serialized[key];
    } else if (actualColumns.includes(key)) {
      payload[key] = serialized[key];
    } else if (key === 'createdAt' && mappedCreatedAt) {
      payload[mappedCreatedAt] = serialized[key];
    } else if (key === 'updatedAt' && mappedUpdatedAt) {
      payload[mappedUpdatedAt] = serialized[key];
    } else {
      extraFields[key] = serialized[key];
    }
  }

  // Pack extra fields or full state into catch-all column if available
  const catchAllCol = catchAllColumns[table];
  if (catchAllCol && actualColumns.includes(catchAllCol)) {
    payload[catchAllCol] = JSON.stringify(serialized);
  }

  return payload;
}

function deserializePayload(table: string, data: any): any {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(v => deserializePayload(table, v));
  }

  let processed = { ...data };

  // 1. Recover Timestamp mapped keys
  if (processed.created_at && !processed.createdAt) {
    processed.createdAt = processed.created_at;
  }
  if (processed.updated_at && !processed.updatedAt) {
    processed.updatedAt = processed.updated_at;
  }
  if (processed.timestamp && !processed.createdAt) {
    processed.createdAt = processed.timestamp;
  }

  // 2. Unpack catch-all JSON if it exists
  const catchAllCol = catchAllColumns[table];
  if (catchAllCol && processed[catchAllCol]) {
    const val = processed[catchAllCol];
    if (typeof val === 'string' && val.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(val);
        // Merge parsed data back, so custom properties are recovered,
        // but database column values overwrite them to stay fresh
        processed = {
          ...parsed,
          ...processed
        };
      } catch (e) {
        // Not JSON or parse failed
      }
    }
  }

  // 3. Reverse custom field mapping rules
  const rules = fieldMappingRules[table];
  if (rules) {
    for (let key in rules) {
      const ruleTarget = rules[key];
      if (processed[ruleTarget] !== undefined && processed[key] === undefined) {
        processed[key] = processed[ruleTarget];
      }
    }
  }

  // Table-specific post-processing fallbacks
  if (table === 'appointments') {
    const typeValue = processed.type || '';
    if (typeof typeValue === 'string' && typeValue.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(typeValue);
        processed = {
          ...processed,
          ...parsed,
          testType: parsed.testType || parsed.type || typeValue
        };
      } catch (e) {
        processed.testType = typeValue;
      }
    } else {
      processed.testType = processed.type || '';
    }

    if (processed.patientName && !processed.patientNameAr) {
      processed.patientNameAr = processed.patientName;
    }
  }

  return convertDates(processed);
}

// LocalStorage Helper functions
const getLocalTable = (table: string): any[] => {
  try {
    const stored = localStorage.getItem(`lab_db_${table}`);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error(`Error reading local table ${table}`, e);
    return [];
  }
};

const saveLocalTable = (table: string, data: any[]) => {
  try {
    localStorage.setItem(`lab_db_${table}`, JSON.stringify(data));
  } catch (e) {
    console.error(`Error saving local table ${table}`, e);
  }
};

export async function addDoc(collectionRef: any, data: any) {
  const id = data.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
  try {
    const payload = await preparePayload(collectionRef.table, { ...data, id });
    const { data: result, error } = await supabase.from(collectionRef.table).insert(payload).select().maybeSingle();
    if (error) { 
      console.warn(`Supabase addDoc insert failed for ${collectionRef.table}, falling back to localStorage:`, error); 
      const localData = getLocalTable(collectionRef.table);
      const newDoc = { ...data, id };
      localData.push(newDoc);
      saveLocalTable(collectionRef.table, localData);
      return { id };
    }
    const processed = deserializePayload(collectionRef.table, result);
    return { id: processed?.id || id };
  } catch (e) {
    console.warn(`Supabase addDoc exception for ${collectionRef.table}, falling back to localStorage:`, e);
    const localData = getLocalTable(collectionRef.table);
    const newDoc = { ...data, id };
    localData.push(newDoc);
    saveLocalTable(collectionRef.table, localData);
    return { id };
  }
}

export async function setDoc(docRef: any, data: any, options?: { merge: boolean }) {
  try {
    const payload = await preparePayload(docRef.table, { id: docRef.id, ...data });
    const { data: result, error } = await supabase.from(docRef.table).upsert(payload).select().maybeSingle();
    if (error) { 
      console.warn(`Supabase setDoc failed for ${docRef.table}, falling back to localStorage:`, error); 
      const localData = getLocalTable(docRef.table);
      const existingIndex = localData.findIndex((d: any) => d.id === docRef.id);
      const newData = { id: docRef.id, ...data };
      if (existingIndex > -1) {
        if (options?.merge) {
          localData[existingIndex] = { ...localData[existingIndex], ...data };
        } else {
          localData[existingIndex] = newData;
        }
      } else {
        localData.push(newData);
      }
      saveLocalTable(docRef.table, localData);
      return newData;
    }
    return deserializePayload(docRef.table, result) || { id: docRef.id, ...data };
  } catch (e) {
    console.warn(`Supabase setDoc exception for ${docRef.table}, falling back to localStorage:`, e);
    const localData = getLocalTable(docRef.table);
    const existingIndex = localData.findIndex((d: any) => d.id === docRef.id);
    const newData = { id: docRef.id, ...data };
    if (existingIndex > -1) {
      if (options?.merge) {
        localData[existingIndex] = { ...localData[existingIndex], ...data };
      } else {
        localData[existingIndex] = newData;
      }
    } else {
      localData.push(newData);
    }
    saveLocalTable(docRef.table, localData);
    return newData;
  }
}

export async function updateDoc(docRef: any, data: any) {
  try {
    const payload = await preparePayload(docRef.table, data);
    const { data: result, error } = await supabase.from(docRef.table).update(payload).eq('id', docRef.id).select().single();
    if (error) { 
      console.warn(`Supabase updateDoc failed for ${docRef.table}, falling back to localStorage:`, error); 
      const localData = getLocalTable(docRef.table);
      const existingIndex = localData.findIndex((d: any) => d.id === docRef.id);
      if (existingIndex > -1) {
        localData[existingIndex] = { ...localData[existingIndex], ...data };
        saveLocalTable(docRef.table, localData);
        return localData[existingIndex];
      }
      throw error;
    }
    return deserializePayload(docRef.table, result);
  } catch (e) {
    console.warn(`Supabase updateDoc exception for ${docRef.table}, falling back to localStorage:`, e);
    const localData = getLocalTable(docRef.table);
    const existingIndex = localData.findIndex((d: any) => d.id === docRef.id);
    if (existingIndex > -1) {
      localData[existingIndex] = { ...localData[existingIndex], ...data };
      saveLocalTable(docRef.table, localData);
      return localData[existingIndex];
    }
    throw e;
  }
}

export async function deleteDoc(docRef: any) {
  try {
    const { error } = await supabase.from(docRef.table).delete().eq('id', docRef.id);
    if (error) { 
      console.warn(`Supabase deleteDoc failed for ${docRef.table}, falling back to localStorage:`, error); 
      const localData = getLocalTable(docRef.table);
      const filtered = localData.filter((d: any) => d.id !== docRef.id);
      saveLocalTable(docRef.table, filtered);
      return;
    }
  } catch (e) {
    console.warn(`Supabase deleteDoc exception for ${docRef.table}, falling back to localStorage:`, e);
    const localData = getLocalTable(docRef.table);
    const filtered = localData.filter((d: any) => d.id !== docRef.id);
    saveLocalTable(docRef.table, filtered);
  }
}

export async function getDoc(docRef: any) {
  if (!docRef || !docRef.table || !docRef.id) {
    console.warn('getDoc: Invalid docRef', docRef);
    return { exists: () => false, data: () => null, id: null };
  }
  try {
    const { data, error } = await supabase.from(docRef.table).select().eq('id', docRef.id).maybeSingle();
    if (error) { 
      console.warn(`Supabase getDoc failed for ${docRef.table} for id ${docRef.id}, falling back to localStorage:`, error);
      const localData = getLocalTable(docRef.table);
      const docData = localData.find((d: any) => d.id === docRef.id);
      return {
        exists: () => !!docData,
        data: () => docData ? deserializePayload(docRef.table, docData) : null,
        id: docRef.id
      };
    }
    const processedData = deserializePayload(docRef.table, data);
    return {
      exists: () => !!data,
      data: () => processedData,
      id: docRef.id
    };
  } catch (e) {
    console.warn(`Supabase getDoc exception for ${docRef.table} for id ${docRef.id}, falling back to localStorage:`, e);
    const localData = getLocalTable(docRef.table);
    const docData = localData.find((d: any) => d.id === docRef.id);
    return {
      exists: () => !!docData,
      data: () => docData ? deserializePayload(docRef.table, docData) : null,
      id: docRef.id
    };
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

function getDocsLocalFallback(table: string, clauses?: any[]) {
  let data = getLocalTable(table);
  
  if (clauses) {
    for (let c of clauses) {
      if (c.field) {
        data = data.filter((item: any) => {
          const val = item[c.field];
          if (c.op === '==' || c.op === '===') {
            return String(val).toLowerCase() === String(c.value).toLowerCase();
          } else if (c.op === '>') {
            return val > c.value;
          } else if (c.op === '<') {
            return val < c.value;
          } else if (c.op === '>=') {
            return val >= c.value;
          } else if (c.op === '<=') {
            return val <= c.value;
          } else if (c.op === 'array-contains') {
            return Array.isArray(val) && val.includes(c.value);
          } else if (c.op === 'in') {
            return Array.isArray(c.value) && c.value.includes(val);
          }
          return true;
        });
      }
      if (c.orderBy) {
        data.sort((a: any, b: any) => {
          const aVal = a[c.orderBy];
          const bVal = b[c.orderBy];
          if (aVal < bVal) return c.direction === 'asc' ? -1 : 1;
          if (aVal > bVal) return c.direction === 'asc' ? 1 : -1;
          return 0;
        });
      }
      if (c.limit) {
        data = data.slice(0, c.limit);
      }
    }
  }

  return {
    empty: data.length === 0,
    docs: data.map((d: any) => {
      const processed = deserializePayload(table, d);
      return {
        id: d.id,
        data: () => processed
      };
    }),
    forEach: (cb: any) => {
      data.forEach((d: any) => {
        const processed = deserializePayload(table, d);
        cb({ id: d.id, data: () => processed });
      });
    }
  };
}

export async function getDocs(queryRef: any) {
  if (!queryRef) return { empty: true, docs: [], forEach: () => {} };
  
  const table = queryRef.table || queryRef.path || (typeof queryRef === 'string' ? queryRef : null);
  if (!table) {
    console.warn('getDocs: Could not determine table name from queryRef', queryRef);
    return { empty: true, docs: [], forEach: () => {} };
  }

  const actualColumns = await getTableColumns(table);
  let req: any = supabase.from(table).select();
  const memoryFilters: any[] = [];
  
  if (queryRef.clauses) {
    for (let c of queryRef.clauses) {
      if (c.field) {
        let queryField = c.field;
        // Map common field names for querying
        if (queryField === 'createdAt' && actualColumns.includes('created_at') && !actualColumns.includes('createdAt')) {
          queryField = 'created_at';
        } else if (queryField === 'updatedAt' && actualColumns.includes('updated_at') && !actualColumns.includes('updatedAt')) {
          queryField = 'updated_at';
        }

        if (actualColumns.includes(queryField)) {
          if (c.op === '==' || c.op === '===') req = req.eq(queryField, c.value);
          else if (c.op === '>') req = req.gt(queryField, c.value);
          else if (c.op === '<') req = req.lt(queryField, c.value);
          else if (c.op === '>=') req = req.gte(queryField, c.value);
          else if (c.op === '<=') req = req.lte(queryField, c.value);
          else if (c.op === 'array-contains') req = req.contains(queryField, [c.value]);
          else if (c.op === 'in') req = req.in(queryField, c.value);
        } else {
          memoryFilters.push(c);
        }
      }
      if (c.orderBy) {
        let orderField = c.orderBy;
        if (orderField === 'createdAt' && actualColumns.includes('created_at') && !actualColumns.includes('createdAt')) {
          orderField = 'created_at';
        }
        if (actualColumns.includes(orderField)) {
          req = req.order(orderField, { ascending: c.direction === 'asc' });
        }
      }
      if (c.limit && memoryFilters.length === 0) {
        req = req.limit(c.limit);
      }
    }
  }

  try {
    const { data, error } = await req;
    if (error) { 
      console.warn(`Supabase getDocs failed for ${table}, falling back to localStorage:`, error); 
      return getDocsLocalFallback(table, queryRef.clauses);
    }
    
    let processedData = (data || []).map((d: any) => deserializePayload(table, d));
    
    // Apply in-memory filters for non-database columns
    if (memoryFilters.length > 0) {
      processedData = processedData.filter((item: any) => {
        for (let c of memoryFilters) {
          const val = item[c.field];
          if (c.op === '==' || c.op === '===') {
            if (String(val).toLowerCase() !== String(c.value).toLowerCase()) return false;
          } else if (c.op === '>') {
            if (!(val > c.value)) return false;
          } else if (c.op === '<') {
            if (!(val < c.value)) return false;
          } else if (c.op === '>=') {
            if (!(val >= c.value)) return false;
          } else if (c.op === '<=') {
            if (!(val <= c.value)) return false;
          } else if (c.op === 'array-contains') {
            if (!(Array.isArray(val) && val.includes(c.value))) return false;
          } else if (c.op === 'in') {
            if (!(Array.isArray(c.value) && c.value.includes(val))) return false;
          }
        }
        return true;
      });
    }

    return {
      empty: processedData.length === 0,
      docs: processedData.map((d: any) => {
        return {
          id: d.id,
          data: () => d
        };
      }),
      forEach: (cb: any) => {
        processedData.forEach((d: any) => {
          cb({ id: d.id, data: () => d });
        });
      }
    };
  } catch (e) {
    console.warn(`Supabase getDocs exception for ${table}, falling back to localStorage:`, e);
    return getDocsLocalFallback(table, queryRef?.clauses);
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

