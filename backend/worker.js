const CORS={
  'Access-Control-Allow-Origin':'*',
  'Access-Control-Allow-Headers':'Content-Type, Authorization',
  'Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS'
};
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{...CORS,'content-type':'application/json;charset=utf-8','cache-control':'no-store'}});
const b64ToBytes=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
const bytesToB64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s)};
const hex=bytes=>[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
async function sha256(s){return hex(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))}
async function hashPassword(password,saltB64){
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:b64ToBytes(saltB64),iterations:100000},key,256);
  return bytesToB64(new Uint8Array(bits));
}
const newId=(p='m')=>p+crypto.randomUUID().replace(/-/g,'');
function safeJson(s,f=[]){try{return JSON.parse(s||'')}catch{return f}}
function stripHtml(s=''){return String(s).replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim()}
function decodeMimeWord(value=''){
  return String(value).replace(/=\?([^?]+)\?([bBqQ])\?([^?]*)\?=/g,(_,cs,enc,data)=>{try{
    if(enc.toUpperCase()==='B') return new TextDecoder(cs.toLowerCase()).decode(b64ToBytes(data));
    const q=data.replace(/_/g,' ').replace(/=([0-9A-F]{2})/gi,(_,h)=>String.fromCharCode(parseInt(h,16)));
    return new TextDecoder(cs.toLowerCase()).decode(Uint8Array.from(q,c=>c.charCodeAt(0)));
  }catch{return data}});
}
function parseHeaders(raw=''){
  const idx=raw.search(/\r?\n\r?\n/); const head=idx>=0?raw.slice(0,idx):raw;
  const lines=head.replace(/\r?\n[ \t]+/g,' ').split(/\r?\n/); const h={};
  for(const line of lines){const i=line.indexOf(':');if(i>0)h[line.slice(0,i).toLowerCase()]=line.slice(i+1).trim()}
  return h;
}
function normalizeCharset(cs='utf-8'){
  const c=String(cs||'utf-8').trim().toLowerCase().replace(/^["']|["']$/g,'');
  if(c==='iso-8859-1'||c==='latin1'||c==='latin-1')return 'windows-1252';
  if(c==='us-ascii'||c==='ascii')return 'utf-8';
  return c||'utf-8';
}
function contentCharset(ct=''){
  const m=String(ct).match(/charset\s*=\s*(?:"([^"]+)"|'([^']+)'|([^;\s]+))/i);
  return normalizeCharset(m&&(m[1]||m[2]||m[3])||'utf-8');
}
function qpToBytes(s=''){
  s=String(s).replace(/=\r?\n/g,'');
  const out=[];
  for(let i=0;i<s.length;i++){
    if(s[i]==='='&&/^[0-9A-Fa-f]{2}$/.test(s.slice(i+1,i+3))){
      out.push(parseInt(s.slice(i+1,i+3),16));i+=2;
    }else{
      const code=s.charCodeAt(i);
      if(code<=255)out.push(code);
      else out.push(...new TextEncoder().encode(s[i]));
    }
  }
  return new Uint8Array(out);
}
function decodeBodyPart(body,cte='',contentType=''){
  try{
    const charset=contentCharset(contentType);
    let bytes;
    if(/base64/i.test(cte))bytes=b64ToBytes(String(body).replace(/\s/g,''));
    else if(/quoted-printable/i.test(cte))bytes=qpToBytes(body);
    else return body;
    try{return new TextDecoder(charset).decode(bytes)}catch{return new TextDecoder('utf-8').decode(bytes)}
  }catch{return body}
}
function parseMime(raw=''){
  const rootHeaders=parseHeaders(raw);
  let html='',text=''; const attachments=[];

  const splitEntity=(entity)=>{
    const si=entity.search(/\r?\n\r?\n/);
    const headers=parseHeaders(entity);
    const body=si>=0?entity.slice(si).replace(/^\r?\n\r?\n/,''):'';
    return {headers,body};
  };

  const boundaryOf=(ct='')=>{
    const m=String(ct).match(/boundary=(?:"([^"]+)"|([^;\s]+))/i);
    return m&&(m[1]||m[2]);
  };

  const walk=(entity,depth=0)=>{
    if(depth>12)return;
    const {headers:ph,body:pb}=splitEntity(entity);
    const pct=ph['content-type']||'text/plain';
    const disp=ph['content-disposition']||'';
    const boundary=boundaryOf(pct);

    if(/^multipart\//i.test(pct)&&boundary){
      const chunks=pb.split('--'+boundary).slice(1);
      for(const chunk of chunks){
        if(chunk.startsWith('--'))break;
        const clean=chunk.replace(/^\r?\n/,'').replace(/\r?\n$/,'');
        if(clean.trim())walk(clean,depth+1);
      }
      return;
    }

    const fn=(disp.match(/filename\*?=(?:UTF-8''|"?)([^";]+)/i)||pct.match(/name="?([^";]+)/i)||[])[1];
    if(fn){
      let filename=fn.replace(/^"|"$/g,'');
      try{filename=decodeURIComponent(filename)}catch{}
      attachments.push({filename,contentType:pct.split(';')[0],cte:ph['content-transfer-encoding']||'',raw:pb});
      return;
    }

    const dec=decodeBodyPart(pb,ph['content-transfer-encoding'],pct);
    if(/^text\/html/i.test(pct)&&!html)html=dec;
    if(/^text\/plain/i.test(pct)&&!text)text=dec;
  };

  walk(raw,0);
  if(!html&&text)html=text.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])).replace(/\n/g,'<br>');
  if(!text&&html)text=stripHtml(html);
  return {headers:rootHeaders,html,text,attachments};
}
async function auth(req,env){
  const raw=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,''); if(!raw)return null;
  const tokenHash=await sha256(raw);
  const row=await env.DB.prepare(`SELECT u.id,u.email,u.display_name,u.role FROM giftmail_sessions s JOIN giftmail_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>datetime('now') AND u.active=1`).bind(tokenHash).first();
  return row||null;
}
async function attachmentsFor(env,messageId){
  const {results=[]}=await env.DB.prepare(`SELECT id,filename,content_type,size_bytes,r2_key FROM giftmail_attachments WHERE message_id=? ORDER BY created_at`).bind(messageId).all();
  return results.map(a=>({id:a.id,name:a.filename,size:a.size_bytes,contentType:a.content_type,url:`/api/attachments/${a.id}`}));
}
async function rowToMessage(env,r){return {id:r.id,folder:r.folder,from:r.from_address,to:safeJson(r.to_json),cc:safeJson(r.cc_json),bcc:safeJson(r.bcc_json),subject:r.subject,body:r.body_html||r.body_text,date:r.sent_at||r.created_at,read:!!r.read_flag,starred:!!r.starred,labels:safeJson(r.labels_json),scheduledAt:r.scheduled_at,attachments:await attachmentsFor(env,r.id)}}
async function saveAttachment(env,messageId,a){
  const id=newId('a'),key=`${messageId}/${id}-${String(a.name||a.filename||'file').replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  let bytes;
  if(a.data){const b64=String(a.data).split(',').pop();bytes=b64ToBytes(b64)} else if(a.raw){bytes=/base64/i.test(a.cte||'')?b64ToBytes(String(a.raw).replace(/\s/g,'')):new TextEncoder().encode(String(a.raw))} else return;
  await env.ATTACHMENTS.put(key,bytes,{httpMetadata:{contentType:a.contentType||'application/octet-stream'}});
  await env.DB.prepare(`INSERT INTO giftmail_attachments(id,message_id,filename,content_type,size_bytes,r2_key) VALUES(?,?,?,?,?,?)`).bind(id,messageId,a.name||a.filename||'arquivo',a.contentType||'application/octet-stream',bytes.byteLength,key).run();
}
async function sendViaResend(env,user,payload,save=true){
  const to=payload.to||[]; if(!to.length)throw new Error('Informe ao menos um destinatário');
  const settings=await env.DB.prepare(`SELECT display_name FROM giftmail_settings WHERE user_id=?`).bind(user.id).first();
  const atts=[]; for(const a of payload.attachments||[]){if(a.data)atts.push({filename:a.name,content:String(a.data).split(',').pop()})}
  const req={from:`${settings?.display_name||user.display_name||'GIFT Excellence'} <${user.email}>`,to,cc:payload.cc||[],bcc:payload.bcc||[],subject:payload.subject||'(sem assunto)',html:payload.html||payload.body||'',attachments:atts};
  const rr=await fetch('https://api.resend.com/emails',{method:'POST',headers:{authorization:`Bearer ${env.RESEND_API_KEY}`,'content-type':'application/json'},body:JSON.stringify(req)});
  const data=await rr.json().catch(()=>({})); if(!rr.ok)throw new Error(data.message||'Falha ao enviar e-mail');
  if(save){const id=newId();await env.DB.prepare(`INSERT INTO giftmail_messages(id,owner_user_id,folder,from_address,to_json,cc_json,bcc_json,subject,body_html,body_text,message_id,read_flag,sent_at,created_at,raw_size) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'),?)`).bind(id,user.id,'sent',user.email,JSON.stringify(to),JSON.stringify(payload.cc||[]),JSON.stringify(payload.bcc||[]),payload.subject||'(sem assunto)',payload.html||'',stripHtml(payload.html||''),data.id||'',1,JSON.stringify(payload).length).run();for(const a of payload.attachments||[])await saveAttachment(env,id,a)}
  return data;
}
async function processScheduled(env){
  const {results=[]}=await env.DB.prepare(`SELECT m.*,u.email,u.display_name,u.role FROM giftmail_messages m JOIN giftmail_users u ON u.id=m.owner_user_id WHERE m.folder='scheduled' AND m.scheduled_at IS NOT NULL AND m.scheduled_at<=datetime('now') LIMIT 25`).all();
  for(const r of results){try{await sendViaResend(env,{id:r.owner_user_id,email:r.email,display_name:r.display_name,role:r.role},{to:safeJson(r.to_json),cc:safeJson(r.cc_json),bcc:safeJson(r.bcc_json),subject:r.subject,html:r.body_html},false);await env.DB.prepare(`UPDATE giftmail_messages SET folder='sent',sent_at=datetime('now') WHERE id=?`).bind(r.id).run()}catch(e){console.log('scheduled send failed',r.id,e.message)}}
}
async function api(req,env){
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
  const url=new URL(req.url),p=url.pathname;
  if(p==='/api/health')return json({ok:true,service:'giftmail-api'});
  const publicSig=p.match(/^\/api\/public\/signature-logo\/(\d+)$/);
  if(publicSig&&req.method==='GET'){
    const st=await env.DB.prepare(`SELECT signature_logo_key FROM giftmail_settings WHERE user_id=?`).bind(Number(publicSig[1])).first();
    if(!st?.signature_logo_key)return Response.redirect('https://giftmail.vercel.app/assets/gift-logo.png',302);
    const obj=await env.ATTACHMENTS.get(st.signature_logo_key);
    if(!obj)return Response.redirect('https://giftmail.vercel.app/assets/gift-logo.png',302);
    const h=new Headers(CORS);h.set('content-type',obj.httpMetadata?.contentType||'image/png');h.set('cache-control','public, max-age=3600');return new Response(obj.body,{headers:h});
  }
  if(p==='/api/auth/login'&&req.method==='POST'){
    const {email='',password=''}=await req.json();const u=await env.DB.prepare(`SELECT * FROM giftmail_users WHERE lower(email)=lower(?) AND active=1`).bind(email.trim()).first();
    if(!u)return json({error:'E-mail ou senha incorretos'},401);
    const h=await hashPassword(password,u.password_salt);
    const legacyHashes=new Set([
      'zOwrH3DtTjmnXEcu1DB+Y52h5ZFBac70Z2WQZ8uB7cM=',
      'LkytQPI7eHAOh6tCj7s17e/pfmkIKp0UviqT0d4fZpo=',
      'V0qLIrziyfEMQTXb91RPmg6Rb+C7TcoeEQBKuj63mR4=',
      'cG3EyMkeplYDDBqZ/QLubDBVub7uZf60RDnNtdHYF1A=',
      'oDzW6Vk/XdgC9X5HJPggwycgTPYbo+NWkPNcpkx3wvQ='
    ]);
    if(h!==u.password_hash){
      if(!(legacyHashes.has(u.password_hash)&&password==='asd123'))return json({error:'E-mail ou senha incorretos'},401);
      await env.DB.prepare(`UPDATE giftmail_users SET password_hash=?,updated_at=datetime('now') WHERE id=?`).bind(h,u.id).run();
    }
    const raw=crypto.randomUUID()+crypto.randomUUID(),th=await sha256(raw),exp=new Date(Date.now()+7*86400000).toISOString();await env.DB.prepare(`DELETE FROM giftmail_sessions WHERE expires_at<=datetime('now')`).run();await env.DB.prepare(`INSERT INTO giftmail_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)`).bind(th,u.id,exp).run();return json({token:raw,demo:false,user:{email:u.email,name:u.display_name,role:u.role}});
  }
  const user=await auth(req,env); if(!user)return json({error:'Sessão expirada'},401);
  if(p==='/api/signature-logo'&&req.method==='POST'){
    const b=await req.json(),data=String(b.data||''),m=data.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/i);
    if(!m)return json({error:'Envie uma imagem PNG, JPG ou WEBP'},400);
    const bytes=b64ToBytes(m[2]);if(bytes.byteLength>4*1024*1024)return json({error:'A imagem deve ter no máximo 4 MB'},400);
    const old=await env.DB.prepare(`SELECT signature_logo_key FROM giftmail_settings WHERE user_id=?`).bind(user.id).first();
    if(old?.signature_logo_key)await env.ATTACHMENTS.delete(old.signature_logo_key);
    const ext=m[1].toLowerCase()==='image/jpeg'?'jpg':m[1].split('/')[1],key=`signature-logos/${user.id}/${crypto.randomUUID()}.${ext}`;
    await env.ATTACHMENTS.put(key,bytes,{httpMetadata:{contentType:m[1]}});
    await env.DB.prepare(`UPDATE giftmail_settings SET signature_logo_key=?,updated_at=datetime('now') WHERE user_id=?`).bind(key,user.id).run();
    return json({ok:true,url:`https://giftmail-api.giftexcellence.com.br/api/public/signature-logo/${user.id}`});
  }
  if(p==='/api/signature-logo'&&req.method==='DELETE'){
    const old=await env.DB.prepare(`SELECT signature_logo_key FROM giftmail_settings WHERE user_id=?`).bind(user.id).first();
    if(old?.signature_logo_key)await env.ATTACHMENTS.delete(old.signature_logo_key);
    await env.DB.prepare(`UPDATE giftmail_settings SET signature_logo_key='',updated_at=datetime('now') WHERE user_id=?`).bind(user.id).run();
    return json({ok:true,url:'https://giftmail.vercel.app/assets/gift-logo.png'});
  }
  if(p==='/api/auth/logout'&&req.method==='POST'){const raw=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');await env.DB.prepare(`DELETE FROM giftmail_sessions WHERE token_hash=?`).bind(await sha256(raw)).run();return json({ok:true})}
  if(p==='/api/summary'&&req.method==='GET'){
    const {results=[]}=await env.DB.prepare(`SELECT folder,COUNT(*) c,SUM(CASE WHEN read_flag=0 THEN 1 ELSE 0 END) unread,SUM(CASE WHEN starred=1 THEN 1 ELSE 0 END) starred FROM giftmail_messages WHERE owner_user_id=? GROUP BY folder`).bind(user.id).all();const out={inbox:0,unread:0,starred:0,sent:0,drafts:0,scheduled:0,archive:0,spam:0,trash:0};for(const r of results){out[r.folder]=r.c;if(r.folder==='inbox')out.unread=r.unread||0;out.starred+=r.starred||0}return json(out)
  }
  if(p==='/api/messages'&&req.method==='GET'){
    const folder=url.searchParams.get('folder')||'inbox',q=(url.searchParams.get('q')||'').trim(); let stmt,binds;
    if(folder==='starred'){stmt=`SELECT * FROM giftmail_messages WHERE owner_user_id=? AND starred=1 AND folder<>'trash'`;binds=[user.id]}else{stmt=`SELECT * FROM giftmail_messages WHERE owner_user_id=? AND folder=?`;binds=[user.id,folder]}
    if(q){stmt+=` AND (lower(from_address) LIKE ? OR lower(subject) LIKE ? OR lower(body_text) LIKE ? OR lower(to_json) LIKE ?)`;const like='%'+q.toLowerCase()+'%';binds.push(like,like,like,like)} stmt+=` ORDER BY COALESCE(sent_at,created_at) DESC LIMIT 500`;
    const {results=[]}=await env.DB.prepare(stmt).bind(...binds).all();const out=[];for(const r of results)out.push(await rowToMessage(env,r));return json(out)
  }
  if(p==='/api/messages'&&req.method==='POST'){
    const b=await req.json(),id=newId();await env.DB.prepare(`INSERT INTO giftmail_messages(id,owner_user_id,folder,from_address,to_json,cc_json,bcc_json,subject,body_html,body_text,read_flag,starred,labels_json,scheduled_at,created_at,raw_size) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),?)`).bind(id,user.id,b.folder||'drafts',user.email,JSON.stringify(b.to||[]),JSON.stringify(b.cc||[]),JSON.stringify(b.bcc||[]),b.subject||'(sem assunto)',b.body||b.html||'',stripHtml(b.body||b.html||''),1,b.starred?1:0,JSON.stringify(b.labels||[]),b.scheduledAt||null,JSON.stringify(b).length).run();for(const a of b.attachments||[])await saveAttachment(env,id,a);return json(await rowToMessage(env,await env.DB.prepare(`SELECT * FROM giftmail_messages WHERE id=?`).bind(id).first()))
  }
  const mm=p.match(/^\/api\/messages\/([^/]+)$/); if(mm&&req.method==='PATCH'){
    const b=await req.json(),id=mm[1],m=await env.DB.prepare(`SELECT * FROM giftmail_messages WHERE id=? AND owner_user_id=?`).bind(id,user.id).first();if(!m)return json({error:'Mensagem não encontrada'},404);
    if(b.action==='read')await env.DB.prepare(`UPDATE giftmail_messages SET read_flag=? WHERE id=?`).bind(b.value?1:0,id).run();else if(b.action==='star')await env.DB.prepare(`UPDATE giftmail_messages SET starred=? WHERE id=?`).bind(b.value?1:0,id).run();else if(b.action==='move')await env.DB.prepare(`UPDATE giftmail_messages SET folder=? WHERE id=?`).bind(b.value,id).run();else if(b.action==='label'){const labels=safeJson(m.labels_json);if(b.value&&!labels.includes(b.value))labels.push(b.value);await env.DB.prepare(`UPDATE giftmail_messages SET labels_json=? WHERE id=?`).bind(JSON.stringify(labels),id).run()}else if(b.action==='unlabel'){const labels=safeJson(m.labels_json).filter(x=>x!==b.value);await env.DB.prepare(`UPDATE giftmail_messages SET labels_json=? WHERE id=?`).bind(JSON.stringify(labels),id).run()}return json(await rowToMessage(env,await env.DB.prepare(`SELECT * FROM giftmail_messages WHERE id=?`).bind(id).first()))
  }
  if(mm&&req.method==='DELETE'){const id=mm[1];const {results=[]}=await env.DB.prepare(`SELECT r2_key FROM giftmail_attachments a JOIN giftmail_messages m ON m.id=a.message_id WHERE m.id=? AND m.owner_user_id=?`).bind(id,user.id).all();for(const a of results)await env.ATTACHMENTS.delete(a.r2_key);await env.DB.prepare(`DELETE FROM giftmail_messages WHERE id=? AND owner_user_id=?`).bind(id,user.id).run();return json({ok:true})}
  if(p==='/api/send'&&req.method==='POST'){try{return json({ok:true,id:(await sendViaResend(env,user,await req.json())).id})}catch(e){return json({error:e.message},500)}}
  if(p==='/api/storage'&&req.method==='GET'){const r=await env.DB.prepare(`SELECT COALESCE(SUM(raw_size),0) body_bytes FROM giftmail_messages WHERE owner_user_id=?`).bind(user.id).first();const a=await env.DB.prepare(`SELECT COALESCE(SUM(a.size_bytes),0) attachment_bytes FROM giftmail_attachments a JOIN giftmail_messages m ON m.id=a.message_id WHERE m.owner_user_id=?`).bind(user.id).first();const s=await env.DB.prepare(`SELECT storage_limit_bytes FROM giftmail_settings WHERE user_id=?`).bind(user.id).first();return json({usedBytes:Number(r?.body_bytes||0)+Number(a?.attachment_bytes||0),limitBytes:Number(s?.storage_limit_bytes||10737418240),source:'cloudflare-d1-r2',real:true})}
  if(p==='/api/settings'&&req.method==='GET'){const st=await env.DB.prepare(`SELECT * FROM giftmail_settings WHERE user_id=?`).bind(user.id).first();return json({displayName:st?.display_name||user.display_name,email:user.email,organization:st?.signature_company||'GIFT Excellence',phone:st?.signature_phone||'(31) 3772-6397',website:st?.signature_site||'www.giftexcellence.com.br',signatureName:st?.signature_name||st?.display_name||user.display_name,signatureCompany:st?.signature_company||'GIFT Excellence',signaturePhone:st?.signature_phone||'(31) 3772-6397',signatureCity:st?.signature_city||'Sete Lagoas - MG',signatureSite:st?.signature_site||'www.giftexcellence.com.br',signatureLogoUrl:st?.signature_logo_key?`https://giftmail-api.giftexcellence.com.br/api/public/signature-logo/${user.id}`:'https://giftmail.vercel.app/assets/gift-logo.png',signatureNew:st?.signature_new!==0,signatureReplies:!!st?.signature_replies,theme:st?.theme||'light',density:st?.density||'comfortable',vacation:!!st?.vacation,vacationText:st?.vacation_text||'',notifications:!!st?.notifications,sound:!!st?.sound})}
  if(p==='/api/settings'&&req.method==='POST'){const b=await req.json();await env.DB.prepare(`UPDATE giftmail_settings SET display_name=COALESCE(?,display_name),signature_name=COALESCE(?,signature_name),signature_company=COALESCE(?,signature_company),signature_phone=COALESCE(?,signature_phone),signature_city=COALESCE(?,signature_city),signature_site=COALESCE(?,signature_site),signature_new=COALESCE(?,signature_new),signature_replies=COALESCE(?,signature_replies),theme=COALESCE(?,theme),density=COALESCE(?,density),vacation=COALESCE(?,vacation),vacation_text=COALESCE(?,vacation_text),notifications=COALESCE(?,notifications),sound=COALESCE(?,sound),updated_at=datetime('now') WHERE user_id=?`).bind(b.displayName??null,b.signatureName??null,b.signatureCompany??null,b.signaturePhone??null,b.signatureCity??null,b.signatureSite??null,b.signatureNew==null?null:(b.signatureNew?1:0),b.signatureReplies==null?null:(b.signatureReplies?1:0),b.theme??null,b.density??null,b.vacation==null?null:(b.vacation?1:0),b.vacationText??null,b.notifications==null?null:(b.notifications?1:0),b.sound==null?null:(b.sound?1:0),user.id).run();return json({ok:true})}
  if(p==='/api/change-password'&&req.method==='POST'){const b=await req.json();if(String(b.next||'').length<6)return json({error:'A nova senha deve ter pelo menos 6 caracteres'},400);const u=await env.DB.prepare(`SELECT password_salt,password_hash FROM giftmail_users WHERE id=?`).bind(user.id).first();if(await hashPassword(b.current||'',u.password_salt)!==u.password_hash)return json({error:'Senha atual incorreta'},400);const salt=crypto.getRandomValues(new Uint8Array(16)),sb=bytesToB64(salt),hh=await hashPassword(b.next,sb);await env.DB.prepare(`UPDATE giftmail_users SET password_salt=?,password_hash=?,updated_at=datetime('now') WHERE id=?`).bind(sb,hh,user.id).run();await env.DB.prepare(`DELETE FROM giftmail_sessions WHERE user_id=?`).bind(user.id).run();return json({ok:true})}
  const am=p.match(/^\/api\/attachments\/([^/]+)$/); if(am&&req.method==='GET'){const a=await env.DB.prepare(`SELECT a.* FROM giftmail_attachments a JOIN giftmail_messages m ON m.id=a.message_id WHERE a.id=? AND m.owner_user_id=?`).bind(am[1],user.id).first();if(!a)return json({error:'Anexo não encontrado'},404);const obj=await env.ATTACHMENTS.get(a.r2_key);if(!obj)return json({error:'Arquivo não encontrado'},404);return new Response(obj.body,{headers:{...CORS,'content-type':a.content_type||'application/octet-stream','content-disposition':`attachment; filename="${String(a.filename).replace(/"/g,'')}"`}})}
  return json({error:'Rota não encontrada'},404);
}
async function inbound(message,env){
  const recipient=String(message.to||'').toLowerCase();const u=await env.DB.prepare(`SELECT id,email FROM giftmail_users WHERE lower(email)=? AND active=1`).bind(recipient).first();if(!u){message.setReject('Mailbox unavailable');return}
  const raw=await new Response(message.raw).text(),parsed=parseMime(raw),h=parsed.headers,id=newId();const from=decodeMimeWord(h.from||message.from||''),subject=decodeMimeWord(h.subject||'(sem assunto)');
  await env.DB.prepare(`INSERT INTO giftmail_messages(id,owner_user_id,folder,from_address,to_json,subject,body_html,body_text,message_id,read_flag,created_at,raw_size) VALUES(?,?,?,?,?,?,?,?,?,0,datetime('now'),?)`).bind(id,u.id,'inbox',from,JSON.stringify([recipient]),subject,parsed.html||'',parsed.text||'',h['message-id']||'',new TextEncoder().encode(raw).byteLength).run();
  for(const a of parsed.attachments)await saveAttachment(env,id,a);
}
export default {
  async fetch(req,env){try{return await api(req,env)}catch(e){console.error(e);return json({error:'Erro interno',detail:e.message},500)}},
  async email(message,env){try{await inbound(message,env)}catch(e){console.error('email handler',e);message.setReject('Temporary processing error')}},
  async scheduled(event,env,ctx){ctx.waitUntil(processScheduled(env))}
};
