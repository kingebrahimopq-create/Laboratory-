import { supabase } from './supabase';

export function ref(storageMock: any, path: string) {
  return { path };
}

export async function uploadBytes(storageRef: any, file: Blob, metadata?: any) {
  const { data, error } = await supabase.storage.from('drive').upload(storageRef.path, file, { upsert: true });
  if (error) { console.error('uploadBytes error', error); throw error; }
  return { ref: storageRef };
}

export async function getDownloadURL(storageRef: any) {
  const { data } = supabase.storage.from('drive').getPublicUrl(storageRef.path);
  return data.publicUrl;
}

export async function listAll(storageRef: any) {
  const { data, error } = await supabase.storage.from('drive').list(storageRef.path || '');
  if (error) { console.error('listAll error', error); throw error; }
  return {
    items: data.map(item => ({
      name: item.name,
      path: (storageRef.path ? storageRef.path + '/' : '') + item.name,
      fullPath: (storageRef.path ? storageRef.path + '/' : '') + item.name
    }))
  };
}

export async function deleteObject(storageRef: any) {
  const { error } = await supabase.storage.from('drive').remove([storageRef.path]);
  if (error) { console.error('deleteObject error', error); throw error; }
}
