import { put, get, list } from '@vercel/blob';
import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { STUDY_ID } from './validation.js';
const prefix = `studies/${STUDY_ID}/`;
export function createStore(env=process.env) {
  const local = env.LOCAL_FEEDBACK === 'true' && !env.VERCEL;
  const directory = env.LOCAL_DATA_DIR || '.local-data';
  const token = env.BLOB_READ_WRITE_TOKEN;
  return {
    configured: local || Boolean(token),
    async save(record) {
      const pathname=`${prefix}${record.participantId}.json`;
      if (local) {
        const folder=join(directory,prefix);await mkdir(folder,{recursive:true});
        const file=join(folder,`${record.participantId}.json`);
        try {await writeFile(file,JSON.stringify(record),{encoding:'utf8',flag:'wx'});return {record,duplicate:false};}
        catch(error){if(error.code==='EEXIST')return {record:JSON.parse(await readFile(file,'utf8')),duplicate:true};throw error;}
      }
      try {await put(pathname,JSON.stringify(record),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:false,token});return {record,duplicate:false};}
      catch(error){
        // A lost success response must not create a second vote on retry.
        const existing=await get(pathname,{access:'private',useCache:false,token}).catch(()=>null);
        if(existing?.statusCode===200){const stored=await new Response(existing.stream).json();if(stored.participantId===record.participantId)return {record:stored,duplicate:true};}
        throw error;
      }
    },
    async page(cursor) {
      if(local){const folder=join(directory,prefix);const files=(await readdir(folder).catch(e=>{if(e.code==='ENOENT')return [];throw e;})).filter(f=>f.endsWith('.json')).sort();const offset=Number(cursor||0);if(!Number.isSafeInteger(offset)||offset<0)throw new Error('Invalid cursor');const batch=files.slice(offset,offset+50);const records=await Promise.all(batch.map(f=>readFile(join(folder,f),'utf8').then(JSON.parse)));return {records,nextCursor:offset+50<files.length?String(offset+50):null};}
      const result=await list({prefix,limit:50,cursor:cursor||undefined,token});
      const records=[];
      for(let i=0;i<result.blobs.length;i+=5){const rows=await Promise.all(result.blobs.slice(i,i+5).map(async blob=>{const result=await get(blob.pathname,{access:'private',token});if(result?.statusCode!==200)throw new Error('Stored response unavailable');return new Response(result.stream).json();}));records.push(...rows);}
      return {records,nextCursor:result.hasMore?result.cursor:null};
    }
  };
}
