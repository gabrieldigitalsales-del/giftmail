const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const API_ROOT=['localhost','127.0.0.1'].includes(location.hostname)?'https://giftmail-api.giftexcellence.com.br':'';
const state={token:localStorage.getItem('giftToken')||sessionStorage.getItem('giftToken')||'',user:null,messages:[],folder:'inbox',filter:'all',selected:new Set(),current:null,settings:{},attachments:[],composeMode:'new'};
const defaults={customFolders:['Comercial','Compras','Engenharia','Financeiro','Projetos'],aliases:[],blocked:[],rules:[],organization:'GIFT Excellence',phone:'(31) 3772-6397',website:'www.giftexcellence.com.br',signatureName:'',signatureCompany:'GIFT Excellence',signaturePhone:'(31) 3772-6397',signatureCity:'Sete Lagoas - MG',signatureSite:'www.giftexcellence.com.br',signatureLogoUrl:'https://giftmail.vercel.app/assets/gift-logo.png',signatureNew:true,signatureReplies:false,forwardEnabled:false,forwardAddress:'',forwardKeepCopy:true,twoFactor:false,suspiciousLogin:true,externalImages:false,desktopNotifications:true,soundNotifications:false,notifyImportant:true,preview:'split'};
function mailIcon(name,size=18){
  const common=`viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;
  const icons={
    compose:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    inbox:'<path d="M4 4h16v16H4z"/><path d="M4 13h4l2 3h4l2-3h4"/>',
    star:'<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.2 6.4 20.2 7.5 14 3 9.6l6.2-.9Z"/>',
    send:'<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    draft:'<path d="M4 4h12l4 4v12H4z"/><path d="M16 4v4h4"/><path d="M8 13h8M8 17h5"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    archive:'<path d="M3 5h18v4H3z"/><path d="M5 9v10h14V9"/><path d="M9 13h6"/>',
    spam:'<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8Z"/><path d="M12 7v6M12 17h.01"/>',
    trash:'<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M7 7l1 13h8l1-13"/><path d="M10 11v5M14 11v5"/>',
    trashSweep:'<path d="M4 7h11"/><path d="M8 7V4h5v3"/><path d="M7 7l1 9h5"/><path d="m15 14 2 2 4-5"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:'<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.8 6.8 0 0 0 21 12.8Z"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H3v-4h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.4 7 7.2 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V3h4v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1H21v4h-.2a1.7 1.7 0 0 0-1.4 1Z"/>',
    key:'<circle cx="8" cy="15" r="3"/><path d="m10.5 12.5 7-7 2 2-2 2 1.5 1.5-2 2-1.5-1.5-3 3"/>',
    logout:'<path d="M10 4H5v16h5"/><path d="M14 8l4 4-4 4M18 12H9"/>',
    folderMove:'<path d="M3 6h6l2 2h10v10H3z"/><path d="M10 13h6M14 10l3 3-3 3"/>',
    more:'<circle cx="6" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1" fill="currentColor" stroke="none"/>',
    moreVertical:'<circle cx="12" cy="5" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>',
    reply:'<path d="m9 17-5-5 5-5"/><path d="M4 12h9a6 6 0 0 1 6 6v1"/>',
    replyAll:'<path d="m7 17-5-5 5-5"/><path d="m12 17-5-5 5-5"/><path d="M7 12h7a6 6 0 0 1 6 6v1"/>',
    forward:'<path d="m15 17 5-5-5-5"/><path d="M20 12h-9a6 6 0 0 0-6 6v1"/>',
    paperclip:'<path d="m21.4 11.6-8.5 8.5a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 1 1-2.8-2.8l8.5-8.5"/>',
    file:'<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v5h5"/>',
    link:'<path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1"/>',
    save:'<path d="M4 4h14l2 2v14H4z"/><path d="M8 4v6h8V4M8 16h8"/>',
    alert:'<path d="M12 3 2.5 20h19Z"/><path d="M12 9v4M12 17h.01"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'
  };
  return `<svg ${common}>${icons[name]||icons.file}</svg>`;
}
function applyMailIcons(){document.querySelectorAll('[data-mail-icon]').forEach(el=>{el.innerHTML=mailIcon(el.dataset.mailIcon,el.dataset.iconSize||18)})}
function toast(msg,error=false){const d=document.createElement('div');d.className='toast'+(error?' error':'');d.textContent=msg;$('#toast').appendChild(d);setTimeout(()=>d.remove(),2800)}
async function api(url,opt={}){opt.headers={...(opt.headers||{}),'Content-Type':'application/json'};if(state.token)opt.headers.Authorization='Bearer '+state.token;const r=await fetch(API_ROOT+url,opt);let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||'Falha na operação');return j}
function initials(s=''){const clean=s.replace(/<.*?>/g,'').trim();const words=clean.split(/\s+/).filter(Boolean);return (words[0]?.[0]||'G')+(words[1]?.[0]||'');}
function nameFromAddress(s=''){const m=s.match(/^([^<]+)</);if(m)return m[1].trim();const x=s.replace(/[<>]/g,'').split('@')[0]||s;return x.split(/[._-]/).map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join(' ')}
function formatDate(s){const d=new Date(s),now=new Date();if(d.toDateString()===now.toDateString())return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});const y=new Date(now);y.setDate(y.getDate()-1);if(d.toDateString()===y.toDateString())return 'Ontem';return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
function stripHtml(h=''){const d=document.createElement('div');d.innerHTML=h;return d.textContent||d.innerText||''}
function splitEmails(v=''){return v.split(/[;,]/).map(x=>x.trim()).filter(Boolean)}
function settingsStorageKey(email=state.settings?.email||state.user?.email||'default'){return 'giftUiSettings:'+String(email).trim().toLowerCase()}
function saveLocalSettings(){localStorage.setItem(settingsStorageKey(),JSON.stringify({...defaults,...state.settings}))}
function loadLocalSettings(email='default'){
  try{
    const scoped=localStorage.getItem(settingsStorageKey(email));
    return scoped?JSON.parse(scoped):{};
  }catch{return {}}
}
function showLogin(){
  $('#appView').classList.add('hidden');
  $('#loginView').classList.remove('hidden');
  const compose=$('#composeWindow');if(compose){compose.classList.add('hidden');compose.classList.remove('min','max','compose-opening','compose-closing')}
  const composeDialog=$('#composeDialog');if(composeDialog){composeDialog.classList.add('hidden');composeDialog.classList.remove('dialog-enter','dialog-leave')}
  const actionDialog=$('#actionDialog');if(actionDialog){actionDialog.classList.add('hidden');actionDialog.classList.remove('dialog-enter','dialog-leave')}
  $('#settingsModal')?.classList.add('hidden');
  $('#profileMenu')?.classList.add('hidden');
  $('#contextMenu')?.classList.add('hidden');
  $('#sidebar')?.classList.remove('open');$('#mobileNavOverlay')?.classList.add('hidden');document.body.classList.remove('mobile-nav-open','mobile-reader-open','mobile-search-open','mobile-header-hidden','mobile-selection-active','settings-open');
}
async function showApp(){
  $('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');
  try{
    const srv=await api('/api/settings');
    const accountEmail=(srv.email||state.user?.email||'').trim().toLowerCase();
    const local=loadLocalSettings(accountEmail);
    state.settings={...defaults,...local,...srv};
    if(state.settings.phone==='(31) 3773-1234')state.settings.phone='(31) 3772-6397';
    if(state.settings.signaturePhone==='(31) 3773-1234')state.settings.signaturePhone='(31) 3772-6397';
    state.user={email:state.settings.email||accountEmail||'admin@giftexcellence.com.br',name:state.settings.displayName||'Administrador'};
    saveLocalSettings();
    applySettings();await refreshAll();
  }catch(e){
    localStorage.removeItem('giftToken');sessionStorage.removeItem('giftToken');
    state.token='';showLogin();toast(e.message,true)
  }
}
function applySettings(){const s=state.settings;$('#profileName').textContent=s.displayName||'Administrador';$('#profileEmail').textContent=s.email||'';$('#menuEmail').textContent=s.email||'';$('#profileAvatar').textContent=initials(s.displayName||s.email).slice(0,1);document.body.classList.toggle('compact',s.density==='compact');let theme=s.theme||'light';if(theme==='system')theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.body.classList.toggle('dark',theme==='dark');$('#themeBtn').innerHTML=mailIcon(theme==='dark'?'moon':'sun',19);renderCustomFolders()}
async function refreshAll(){await Promise.all([loadSummary(),loadMessages(),loadStorage()])}
function formatBytes(bytes){if(bytes==null||Number.isNaN(Number(bytes)))return '—';const n=Number(bytes);if(n<1024)return n+' B';const u=['KB','MB','GB','TB'];let v=n/1024,i=0;while(v>=1024&&i<u.length-1){v/=1024;i++}return v.toLocaleString('pt-BR',{maximumFractionDigits:v<10?2:1})+' '+u[i]}
async function loadStorage(){try{const st=await api('/api/storage');const used=st.usedBytes;const limit=st.limitBytes;const pct=(used!=null&&limit)?Math.max(0,Math.min(100,(used/limit)*100)):0;$('#storageText').textContent=used==null?('Aguardando provedor · '+formatBytes(limit)):(formatBytes(used)+' de '+formatBytes(limit));$('#storageBar').style.width=pct+'%';const bu=$('#storageUsedBig'),bl=$('#storageLimitBig'),bb=$('#storageBarBig'),src=$('#storageSource');if(bu)bu.textContent=used==null?'Aguardando dados':formatBytes(used);if(bl)bl.textContent='de '+formatBytes(limit)+' utilizados';if(bb)bb.style.width=pct+'%';if(src)src.textContent=st.real?(st.source==='local-demo'?'Uso real dos dados locais atuais':'Uso informado pelo servidor/provedor'):'Preparado para receber a quota real do provedor';}catch(e){$('#storageText').textContent='Indisponível';$('#storageBar').style.width='0%';}}
async function loadSummary(){const s=await api('/api/summary');for(const k of ['inbox','starred','sent','drafts','scheduled','archive','spam','trash']){const el=$('#count-'+k);if(el)el.textContent=s[k]||''}}
async function loadMessages(){state.selected.clear();$('#selectAll').checked=false;let folder=state.folder;let q=$('#searchInput').value.trim();let data=await api('/api/messages?folder='+encodeURIComponent(folder)+(q?'&q='+encodeURIComponent(q):''));state.messages=data;updateFolderActions();renderMessages()}
function filteredMessages(){let m=[...state.messages];if(state.filter==='unread')m=m.filter(x=>!x.read);if(state.filter==='starred')m=m.filter(x=>x.starred);const f=$('#searchFrom').value.trim().toLowerCase(),t=$('#searchTo').value.trim().toLowerCase(),sub=$('#searchSubject').value.trim().toLowerCase(),att=$('#searchHasAttachment').value;if(f)m=m.filter(x=>(x.from||'').toLowerCase().includes(f));if(t)m=m.filter(x=>(x.to||[]).join(' ').toLowerCase().includes(t));if(sub)m=m.filter(x=>(x.subject||'').toLowerCase().includes(sub));if(att==='yes')m=m.filter(x=>(x.attachments||[]).length);if(att==='no')m=m.filter(x=>!(x.attachments||[]).length);return m}
function updateMobileSelectionBar(){document.body.classList.toggle('mobile-selection-active',state.selected.size>0);const sa=$('#selectAll');if(sa)sa.checked=filteredMessages().length>0&&filteredMessages().every(m=>state.selected.has(m.id))}
function renderMessages(){const list=$('#messageList');list.innerHTML='';const msgs=filteredMessages();$('#folderLabel').textContent=folderNames[state.folder]||state.folder;for(const m of msgs){const card=document.createElement('div');card.className='message-card'+(!m.read?' unread':'')+(state.current?.id===m.id?' active':'');card.dataset.id=m.id;const nm=nameFromAddress(m.from||m.to?.[0]||'');card.innerHTML=`<input class="msg-check" type="checkbox" ${state.selected.has(m.id)?'checked':''}><div class="sender-avatar">${initials(nm).slice(0,2)}</div><div class="message-main"><div class="sender-line"><strong>${escapeHtml(nm)}</strong><time>${formatDate(m.date)}</time></div><div class="subject-line"><b>${escapeHtml(m.subject||'(sem assunto)')}</b>${(m.attachments||[]).length?' <span class="inline-mail-icon">'+mailIcon('paperclip',14)+'</span>':''}</div><div class="preview-line">${escapeHtml(stripHtml(m.body||''))}</div></div><button class="star-btn ${m.starred?'on':''}">${m.starred?'★':'☆'}</button>`;card.addEventListener('click',e=>{if(e.target.matches('.msg-check,.star-btn'))return;openMessage(m)});card.querySelector('.msg-check').onchange=e=>{e.target.checked?state.selected.add(m.id):state.selected.delete(m.id);updateMobileSelectionBar()};card.querySelector('.star-btn').onclick=()=>toggleStar(m);card.oncontextmenu=e=>showMessageContext(e,m);list.appendChild(card)}if(!msgs.length)list.innerHTML='<div class="empty-reader" style="height:240px"><div class="mail-illustration">⌕</div><h2>Nenhum e-mail</h2><p>Não encontramos mensagens nesta visualização.</p></div>';updateMobileSelectionBar()}
function escapeHtml(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
async function openMessage(m){state.current=m;if(!m.read){try{await api('/api/messages/'+m.id,{method:'PATCH',body:JSON.stringify({action:'read',value:true,folder:m.folder})});m.read=true;loadSummary()}catch{}}renderMessages();renderReader(m);if(innerWidth<820){$('#readerPane').classList.add('mobile-open');document.body.classList.add('mobile-reader-open')}}
function renderReader(m){const nm=nameFromAddress(m.from||'');const reader=$('#readerPane');const at=(m.attachments||[]).map(a=>`<span class="attachment-chip"><b>${(a.name||'FILE').split('.').pop().toUpperCase()}</b><span>${escapeHtml(a.name||'Anexo')}<small>${a.size?' · '+escapeHtml(a.size):''}</small></span><button class="attachment-download" data-id="${escapeHtml(a.id||'')}" data-name="${escapeHtml(a.name||'anexo')}" title="Baixar">${mailIcon('archive',15)}</button></span>`).join('');reader.innerHTML=`<button class="mobile-reader-back" type="button">← Voltar</button><div class="reader-head"><div class="reader-title"><h1>${escapeHtml(m.subject||'(sem assunto)')}</h1><span class="folder-pill">${escapeHtml(folderNames[m.folder]||m.folder||'')}</span></div><div class="reader-meta"><div class="sender-avatar">${initials(nm).slice(0,2)}</div><div><strong>${escapeHtml(nm)} <small style="display:inline">&lt;${escapeHtml(extractEmail(m.from||''))}&gt;</small></strong><small>para mim · ${new Date(m.date).toLocaleString('pt-BR')}</small></div><div class="reader-meta-actions"><button class="inlineStar">${m.starred?'★':'☆'}</button><button class="inlineReply">${mailIcon('reply',16)}</button><button class="inlineMore">${mailIcon('moreVertical',16)}</button></div></div></div><div class="reader-body">${normalizeBody(m.body)}</div>${at?`<div class="attachment-block"><strong>${m.attachments.length} anexo${m.attachments.length>1?'s':''}</strong><div style="margin-top:10px">${at}</div></div>`:''}`;reader.querySelector('.mobile-reader-back')?.addEventListener('click',()=>{reader.classList.remove('mobile-open');document.body.classList.remove('mobile-reader-open')});reader.querySelector('.inlineStar').onclick=()=>toggleStar(m);reader.querySelector('.inlineReply').onclick=()=>openCompose('reply',m);reader.querySelector('.inlineMore').onclick=e=>{e.stopPropagation();showReaderContext(e,m)};reader.querySelectorAll('.attachment-download').forEach(b=>b.onclick=()=>downloadAttachment(b.dataset.id,b.dataset.name))}
function extractEmail(s=''){const m=s.match(/<([^>]+)>/);return m?m[1]:s}
function sanitizeEmailHtml(html=''){
  try{
    const doc=new DOMParser().parseFromString(String(html),'text/html');
    doc.querySelectorAll('script,style,iframe,object,embed,form,input,button,textarea,select,option,meta,link,base,svg').forEach(el=>el.remove());
    doc.querySelectorAll('*').forEach(el=>{
      [...el.attributes].forEach(a=>{
        const n=a.name.toLowerCase(),v=String(a.value||'').trim();
        if(n.startsWith('on')||n==='srcdoc'||n==='formaction')el.removeAttribute(a.name);
        if((n==='href'||n==='src'||n==='xlink:href')&&/^\s*(javascript|vbscript|data:text\/html)/i.test(v))el.removeAttribute(a.name);
        if(n==='style'&&/(position\s*:\s*(absolute|fixed|sticky)|z-index\s*:|(?:^|;)\s*(top|left|right|bottom|inset)\s*:|expression\s*\(|javascript\s*:)/i.test(v))el.removeAttribute('style');
      });
      if(el.tagName==='A'){el.setAttribute('target','_blank');el.setAttribute('rel','noopener noreferrer')}
      if(el.tagName==='IMG'){el.style.maxWidth='100%';el.style.height='auto'}
    });
    return doc.body.innerHTML;
  }catch{return escapeHtml(String(html))}
}
function normalizeBody(body=''){
  if(/<\w+/.test(body))return sanitizeEmailHtml(body);
  return body.split(/\n{2,}/).map(p=>`<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')
}
async function downloadAttachment(id,name='anexo'){try{const r=await fetch(API_ROOT+'/api/attachments/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+state.token}});if(!r.ok)throw new Error('Não foi possível baixar o anexo');const blob=await r.blob(),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}catch(e){toast(e.message,true)}}
async function toggleStar(m){m.starred=!m.starred;renderMessages();if(state.current?.id===m.id)renderReader(m);try{await api('/api/messages/'+m.id,{method:'PATCH',body:JSON.stringify({action:'star',value:m.starred,folder:m.folder})});loadSummary()}catch(e){toast(e.message,true)}}
const folderNames={inbox:'Caixa de Entrada',starred:'Favoritos',sent:'Enviados',drafts:'Rascunhos',scheduled:'Agendados',archive:'Arquivo',spam:'Spam',trash:'Lixeira'};
async function moveSelected(folder){const ids=state.selected.size?[...state.selected]:(state.current?[state.current.id]:[]);if(!ids.length)return toast('Selecione ao menos uma mensagem',true);for(const id of ids){const m=state.messages.find(x=>x.id===id)||state.current;await api('/api/messages/'+id,{method:'PATCH',body:JSON.stringify({action:'move',value:folder,folder:m?.folder||state.folder})})}toast('Mensagem(ns) movida(s)');state.current=null;$('#readerPane').innerHTML='<div class="empty-reader"><div class="mail-illustration">✉</div><h2>Selecione uma mensagem</h2><p>O conteúdo do e-mail aparecerá aqui.</p></div>';await refreshAll()}
async function markSelected(read=true){const ids=state.selected.size?[...state.selected]:(state.current?[state.current.id]:[]);if(!ids.length)return toast('Selecione ao menos uma mensagem',true);for(const id of ids){const m=state.messages.find(x=>x.id===id)||state.current;await api('/api/messages/'+id,{method:'PATCH',body:JSON.stringify({action:'read',value:read,folder:m?.folder||state.folder})})}await refreshAll()}
function renderComposeSignature(){const ed=$('#bodyEditor');ed.querySelector('[data-gift-signature]')?.remove();if(state.settings.signatureNew)appendSignature()}

function resetCompose(){
  state.composeMode='new';state.attachments=[];
  $('#toField').value='';$('#ccField').value='';$('#bccField').value='';$('#subjectField').value='';
  $('#bodyEditor').innerHTML='';$('#attachmentPreview').innerHTML='';
  $('#ccBccFields').classList.add('hidden');$('#scheduleMenu').classList.add('hidden');
  $('#composeWindow').classList.remove('min','max','compose-opening','compose-closing');
}
function composeHasContent(){
  const clone=$('#bodyEditor').cloneNode(true);clone.querySelectorAll('[data-gift-signature]').forEach(x=>x.remove());
  const typed=(clone.innerText||clone.textContent||'').replace(/\s+/g,' ').trim();
  return !!(typed||$('#toField').value.trim()||$('#ccField').value.trim()||$('#bccField').value.trim()||$('#subjectField').value.trim()||state.attachments.length);
}
function showComposeWindow(){
  const w=$('#composeWindow');w.classList.remove('hidden','compose-closing');w.classList.add('compose-opening');
  setTimeout(()=>w.classList.remove('compose-opening'),220);
}
function hideComposeWindow(reset=true){
  const w=$('#composeWindow');
  if(w.classList.contains('hidden')){if(reset)resetCompose();return}
  w.classList.remove('compose-opening');w.classList.add('compose-closing');
  setTimeout(()=>{w.classList.add('hidden');w.classList.remove('compose-closing');if(reset)resetCompose()},180);
}

let composeDialogMode='';
let pendingComposeOpen=null;
function openComposeDialog(mode){
  composeDialogMode=mode;
  const modal=$('#composeDialog'),title=$('#composeDialogTitle'),text=$('#composeDialogText');
  const cancel=$('#composeDialogCancel'),secondary=$('#composeDialogSecondary'),primary=$('#composeDialogPrimary');
  cancel.classList.remove('hidden');secondary.classList.remove('hidden');primary.classList.remove('danger');
  if(mode==='close-dirty'){
    title.textContent='Fechar novo e-mail?';
    text.textContent='Você tem alterações nesta mensagem. Deseja salvar como rascunho antes de fechar?';
    secondary.textContent='Não salvar';primary.textContent='Salvar rascunho';
  }else if(mode==='close-empty'){
    title.textContent='Fechar novo e-mail?';
    text.textContent='Deseja fechar esta janela de composição?';
    secondary.classList.add('hidden');primary.textContent='Fechar';
  }else if(mode==='save-draft'){
    title.textContent='Salvar como rascunho?';
    text.textContent='A mensagem será salva em Rascunhos e a janela será fechada.';
    secondary.classList.add('hidden');primary.textContent='Salvar rascunho';
  }else if(mode==='discard'){
    title.textContent='Descartar mensagem?';
    text.textContent='Esta mensagem será apagada e não poderá ser recuperada.';
    secondary.classList.add('hidden');primary.textContent='Descartar';primary.classList.add('danger');
  }else if(mode==='replace'){
    title.textContent='Abrir outra mensagem?';
    text.textContent='Há uma composição em andamento. Salve como rascunho ou descarte antes de continuar.';
    secondary.textContent='Descartar';primary.textContent='Salvar rascunho';
  }
  modal.classList.remove('hidden','dialog-leave');
  requestAnimationFrame(()=>modal.classList.add('dialog-enter'));
}
function closeComposeDialog(){
  const modal=$('#composeDialog');modal.classList.remove('dialog-enter');modal.classList.add('dialog-leave');
  setTimeout(()=>{modal.classList.add('hidden');modal.classList.remove('dialog-leave')},140);
}
async function performDialogPrimary(){
  const mode=composeDialogMode;
  if(mode==='close-empty'){closeComposeDialog();hideComposeWindow(true);return}
  if(mode==='discard'){closeComposeDialog();hideComposeWindow(true);return}
  if(mode==='close-dirty'||mode==='save-draft'||mode==='replace'){
    const ok=await saveDraftInternal();
    if(!ok)return;
    closeComposeDialog();
    hideComposeWindow(true);
    if(mode==='replace'&&pendingComposeOpen){const p=pendingComposeOpen;pendingComposeOpen=null;setTimeout(()=>openCompose(p.mode,p.message),210)}
  }
}
function performDialogSecondary(){
  const mode=composeDialogMode;
  closeComposeDialog();
  if(mode==='close-dirty'){hideComposeWindow(true);return}
  if(mode==='replace'){
    hideComposeWindow(true);
    if(pendingComposeOpen){const p=pendingComposeOpen;pendingComposeOpen=null;setTimeout(()=>openCompose(p.mode,p.message),210)}
  }
}
let actionDialogConfirmFn=null;
function openActionDialog({title='Confirmar ação',text='',confirmLabel='Confirmar',cancelLabel='Cancelar',danger=false,icon='alert',onConfirm=null}){
  actionDialogConfirmFn=onConfirm;
  $('#actionDialogTitle').textContent=title;$('#actionDialogText').textContent=text;
  $('#actionDialogConfirm').textContent=confirmLabel;$('#actionDialogCancel').textContent=cancelLabel;
  $('#actionDialogConfirm').classList.toggle('danger',!!danger);
  $('#actionDialogIcon').innerHTML=mailIcon(icon,20);
  const modal=$('#actionDialog');modal.classList.remove('hidden','dialog-leave');requestAnimationFrame(()=>modal.classList.add('dialog-enter'));
}
function closeActionDialog(){const modal=$('#actionDialog');modal.classList.remove('dialog-enter');modal.classList.add('dialog-leave');setTimeout(()=>{modal.classList.add('hidden');modal.classList.remove('dialog-leave');actionDialogConfirmFn=null},140)}
async function confirmActionDialog(){const fn=actionDialogConfirmFn;const btn=$('#actionDialogConfirm');if(!fn)return closeActionDialog();btn.disabled=true;const label=btn.textContent;btn.textContent='Aguarde...';try{await fn();closeActionDialog()}catch(e){toast(e.message||'Falha na operação',true)}finally{btn.disabled=false;btn.textContent=label}}
function selectedMessageIds(){return state.selected.size?[...state.selected]:(state.current?[state.current.id]:[])}
async function deleteSelectedPermanently(){const ids=selectedMessageIds();if(!ids.length)return toast('Selecione ao menos uma mensagem',true);for(const id of ids)await api('/api/messages/'+id,{method:'DELETE'});state.current=null;$('#readerPane').innerHTML='<div class="empty-reader"><div class="mail-illustration">✉</div><h2>Selecione uma mensagem</h2><p>O conteúdo do e-mail aparecerá aqui.</p></div>';toast(ids.length>1?'Mensagens excluídas definitivamente':'Mensagem excluída definitivamente');await refreshAll()}
function requestDeleteSelected(){const ids=selectedMessageIds();if(!ids.length)return toast('Selecione ao menos uma mensagem',true);const permanent=state.folder==='trash';openActionDialog({title:permanent?'Excluir definitivamente?':'Mover para a lixeira?',text:permanent?(ids.length>1?`As ${ids.length} mensagens selecionadas serão excluídas definitivamente.`:'Esta mensagem será excluída definitivamente.'):(ids.length>1?`As ${ids.length} mensagens selecionadas serão movidas para a Lixeira.`:'Esta mensagem será movida para a Lixeira.'),confirmLabel:permanent?'Excluir definitivamente':'Mover para lixeira',danger:true,icon:'trash',onConfirm:()=>permanent?deleteSelectedPermanently():moveSelected('trash')})}
async function emptyTrashNow(){const trash=await api('/api/messages?folder=trash');if(!trash.length){toast('A lixeira já está vazia');return}for(const m of trash)await api('/api/messages/'+m.id,{method:'DELETE'});state.current=null;toast('Lixeira esvaziada');await refreshAll()}
function requestEmptyTrash(){openActionDialog({title:'Esvaziar lixeira?',text:'Todos os e-mails da Lixeira serão excluídos definitivamente. Esta ação não pode ser desfeita.',confirmLabel:'Esvaziar lixeira',danger:true,icon:'trashSweep',onConfirm:emptyTrashNow})}
async function emptySpamNow(){const spam=await api('/api/messages?folder=spam');if(!spam.length){toast('O spam já está vazio');return}for(const m of spam)await api('/api/messages/'+m.id,{method:'DELETE'});toast('Spam esvaziado');await refreshAll()}
function requestEmptySpam(){openActionDialog({title:'Esvaziar spam?',text:'Todas as mensagens da pasta Spam serão excluídas definitivamente.',confirmLabel:'Esvaziar spam',danger:true,icon:'spam',onConfirm:emptySpamNow})}
function requestLogout(){openActionDialog({title:'Sair do GIFT Mail?',text:'Sua sessão será encerrada neste dispositivo.',confirmLabel:'Sair',danger:true,icon:'logout',onConfirm:logout})}
function updateFolderActions(){const btn=$('#emptyTrashActionBtn');if(btn)btn.classList.toggle('hidden',state.folder!=='trash')}
function requestOpenCompose(mode='new',message=null){
  if(!state.token||!$('#loginView').classList.contains('hidden'))return;
  const w=$('#composeWindow');
  if(!w.classList.contains('hidden')&&composeHasContent()){
    pendingComposeOpen={mode,message};openComposeDialog('replace');return;
  }
  openCompose(mode,message);
}
function openCompose(mode='new',m=null){
  if(!state.token||!$('#loginView').classList.contains('hidden'))return;
  document.body.classList.remove('mobile-header-hidden');
  state.composeMode=mode;state.attachments=[];$('#composeWindow').classList.remove('max');$('#attachmentPreview').innerHTML='';
  $('#composeTitle').textContent=mode==='new'?'Novo e-mail':mode==='reply'?'Responder':mode==='replyAll'?'Responder a todos':mode==='forward'?'Encaminhar':'Novo e-mail';
  $('#toField').value='';$('#ccField').value='';$('#bccField').value='';$('#subjectField').value='';
  $('#bodyEditor').innerHTML='';$('#ccBccFields').classList.add('hidden');$('#scheduleMenu').classList.add('hidden');
  if(mode==='new')renderComposeSignature();
  if(m){
    if(mode==='reply'||mode==='replyAll'){
      $('#toField').value=extractEmail(m.from||'');
      if(mode==='replyAll')$('#ccField').value=(m.to||[]).filter(x=>x!==state.settings.email).join(', ');
      $('#subjectField').value=(/^re:/i.test(m.subject)?'':'RE: ')+(m.subject||'');
      $('#bodyEditor').innerHTML='<br><br><div class="quoted-message" style="border-left:2px solid #ddd;padding-left:12px;color:#666">Em '+new Date(m.date).toLocaleString('pt-BR')+', '+escapeHtml(nameFromAddress(m.from||''))+' escreveu:<br>'+normalizeBody(m.body)+'</div>';
      if(state.settings.signatureReplies)appendSignature();
    }else if(mode==='forward'){
      $('#subjectField').value=(/^enc:/i.test(m.subject)?'':'ENC: ')+(m.subject||'');
      $('#bodyEditor').innerHTML='<br><br><div class="quoted-message" style="border-top:1px solid #ddd;padding-top:12px;color:#666">---------- Mensagem encaminhada ----------<br><b>De:</b> '+escapeHtml(m.from||'')+'<br><b>Assunto:</b> '+escapeHtml(m.subject||'')+'<br><br>'+normalizeBody(m.body)+'</div>';
      state.attachments=[...(m.attachments||[])];renderComposeAttachments();
      if(state.settings.signatureReplies)appendSignature();
    }
  }
  showComposeWindow();
  requestAnimationFrame(()=>$('#bodyEditor').focus());
}
function signatureHtml(settings=state.settings){
  const name=escapeHtml(settings.signatureName||settings.displayName||nameFromAddress(settings.email||'GIFT'));
  const company=escapeHtml(settings.signatureCompany||'GIFT Excellence');
  const phone=escapeHtml(settings.signaturePhone||'(31) 3772-6397');
  const city=escapeHtml(settings.signatureCity||'Sete Lagoas - MG');
  const site=escapeHtml(settings.signatureSite||'www.giftexcellence.com.br');
  const email=escapeHtml(settings.email||'');
  const logo=escapeHtml(settings.signatureLogoUrl||'https://giftmail.vercel.app/assets/gift-logo.png');
  const hrefSite=/^https?:\/\//i.test(settings.signatureSite||'')?(settings.signatureSite||''):'https://'+(settings.signatureSite||'www.giftexcellence.com.br');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:620px;width:100%;margin-top:24px"><tr><td style="padding:6px 24px 14px 0;width:210px;vertical-align:middle"><img src="${logo}" alt="GIFT Excellence" style="display:block;max-width:195px;max-height:95px;width:auto;height:auto;border:0"></td><td style="border-left:2px solid #ff161f;padding:6px 0 14px 24px;vertical-align:middle"><div style="font-size:16px;font-weight:700;line-height:1.25;margin-bottom:2px">${name}</div><div style="font-size:12px;color:#666;margin-bottom:9px">${company}</div><div style="font-size:12px;line-height:1.65">☎&nbsp; ${phone}<br>✉&nbsp; ${email}<br>●&nbsp; ${city}</div></td></tr><tr><td colspan="2" style="border-top:2px solid #ff161f;padding-top:9px"><a href="${escapeHtml(hrefSite)}" style="font-size:12px;color:#ff161f;text-decoration:none">${site}</a></td></tr></table>`;
}
function ensureMessageArea(){return $('#bodyEditor')}
function focusMessageArea(){
  requestAnimationFrame(()=>{
    const ed=$('#bodyEditor');if(!ed)return;
    ed.focus();
    const target=ed.querySelector('[data-compose-input]')||ed;
    try{
      const range=document.createRange(),sel=window.getSelection();
      range.selectNodeContents(target);
      range.collapse(true);
      sel.removeAllRanges();sel.addRange(range);
    }catch{}
  });
}
function appendSignature(){
  const ed=$('#bodyEditor');ed.querySelector('[data-gift-signature]')?.remove();
  if(!ed.textContent.trim()&&!ed.querySelector('[data-compose-input]')){
    const input=document.createElement('div');
    input.dataset.composeInput='1';
    input.innerHTML='<br>';
    ed.appendChild(input);
  }else if(ed.innerHTML.trim()){
    ed.insertAdjacentHTML('beforeend','<br><br>');
  }
  const sig=document.createElement('div');
  sig.className='signature-block';
  sig.dataset.giftSignature='1';
  sig.setAttribute('contenteditable','false');
  sig.innerHTML=signatureHtml();
  ed.appendChild(sig);
  focusMessageArea();
}
function prependSignature(){appendSignature()}
function renderSignaturePreview(){const el=$('#signaturePreview');if(!el)return;const preview={...state.settings,signatureName:$('#signatureName')?.value||state.settings.signatureName,signatureCompany:$('#signatureCompany')?.value||state.settings.signatureCompany,signaturePhone:$('#signaturePhone')?.value||state.settings.signaturePhone,signatureCity:$('#signatureCity')?.value||state.settings.signatureCity,signatureSite:$('#signatureSite')?.value||state.settings.signatureSite};el.innerHTML=signatureHtml(preview)}
function renderComposeAttachments(){$('#attachmentPreview').innerHTML=state.attachments.map((a,i)=>`<span class="attachment-chip"><b>${(a.name||'FILE').split('.').pop().toUpperCase()}</b>${escapeHtml(a.name||'Anexo')} <button data-i="${i}">×</button></span>`).join('');$$('#attachmentPreview button').forEach(b=>b.onclick=()=>{state.attachments.splice(+b.dataset.i,1);renderComposeAttachments()})}
async function buildAndSaveMessage(folder='sent',scheduledAt=null){
  const to=splitEmails($('#toField').value);
  if(folder==='sent'&&!to.length){toast('Informe ao menos um destinatário',true);return false}
  const composedHtml=$('#bodyEditor').innerHTML;
  const payload={folder,from:state.settings.email,to,cc:splitEmails($('#ccField').value),bcc:splitEmails($('#bccField').value),subject:$('#subjectField').value||'(sem assunto)',html:composedHtml,attachments:state.attachments,scheduledAt};
  try{
    if(folder==='sent')await api('/api/send',{method:'POST',body:JSON.stringify(payload)});
    else await api('/api/messages',{method:'POST',body:JSON.stringify({...payload,body:payload.html,read:true,starred:false,labels:[]})});
    await refreshAll();return true;
  }catch(e){toast(e.message,true);return false}
}
async function saveDraftInternal(){
  const btn=$('#composeDialogPrimary');if(btn){btn.disabled=true;btn.dataset.label=btn.textContent;btn.textContent='Salvando...'}
  const ok=await buildAndSaveMessage('drafts');
  if(btn){btn.disabled=false;btn.textContent=btn.dataset.label||'Salvar rascunho'}
  if(ok)toast('Rascunho salvo');return ok;
}
async function sendMessage(folder='sent',scheduledAt=null){
  const ok=await buildAndSaveMessage(folder,scheduledAt);if(!ok)return;
  toast(folder==='sent'?'E-mail enviado':folder==='scheduled'?'E-mail agendado':'Rascunho salvo');
  hideComposeWindow(true);
}
function fillSettings(){const s=state.settings;$('#settingsLoggedEmail').textContent=s.email||'';$('#setDisplayName').value=s.displayName||'';$('#setEmail').value=s.email||'';$('#setOrganization').value=s.organization||'';const unifiedPhone=s.signaturePhone||s.phone||'(31) 3772-6397';$('#setPhone').value=unifiedPhone;$('#setWebsite').value=s.website||'';$('#signatureName').value=s.signatureName||s.displayName||'';$('#signatureCompany').value=s.signatureCompany||'GIFT Excellence';$('#signaturePhone').value=unifiedPhone;$('#signatureCity').value=s.signatureCity||'Sete Lagoas - MG';$('#signatureSite').value=s.signatureSite||s.website||'www.giftexcellence.com.br';$('#signatureNew').checked=!!s.signatureNew;$('#signatureReplies').checked=!!s.signatureReplies;$('#forwardEnabled').checked=!!s.forwardEnabled;$('#forwardAddress').value=s.forwardAddress||'';$('#forwardKeepCopy').checked=s.forwardKeepCopy!==false;$('#vacationEnabled').checked=!!s.vacation;$('#vacationText').value=s.vacationText||'';$('#vacationSubject').value=s.vacationSubject||'Resposta automática';$('#vacationStart').value=s.vacationStart||'';$('#vacationEnd').value=s.vacationEnd||'';$('#twoFactor').checked=!!s.twoFactor;$('#suspiciousLogin').checked=s.suspiciousLogin!==false;$('#externalImages').checked=!!s.externalImages;$('#desktopNotifications').checked=s.desktopNotifications!==false;$('#soundNotifications').checked=!!s.soundNotifications;$('#notifyImportant').checked=s.notifyImportant!==false;$('#setTheme').value=s.theme||'light';$('#setDensity').value=s.density||'comfortable';$('#setPreview').value=s.preview||'split';renderAliasList();renderBlockedList();renderRulesList();renderSignaturePreview()}
function openSettings(tab='account'){document.body.classList.add('settings-open');document.body.classList.remove('mobile-header-hidden');$('#settingsModal').classList.remove('hidden');fillSettings();switchSettingsTab(tab)}
function switchSettingsTab(tab){if(tab==='storage')loadStorage();$$('#settingsNav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$$('.settings-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===tab))}
function renderAliasList(){$('#aliasList').innerHTML=(state.settings.aliases||[]).map((x,i)=>`<span class="chip">${escapeHtml(x)}<button data-i="${i}">×</button></span>`).join('');$$('#aliasList button').forEach(b=>b.onclick=()=>{state.settings.aliases.splice(+b.dataset.i,1);renderAliasList()})}
function renderBlockedList(){$('#blockedList').innerHTML=(state.settings.blocked||[]).map((x,i)=>`<span class="chip">${escapeHtml(x)}<button data-i="${i}">×</button></span>`).join('');$$('#blockedList button').forEach(b=>b.onclick=()=>{state.settings.blocked.splice(+b.dataset.i,1);renderBlockedList()})}
function renderRulesList(){$('#rulesList').innerHTML=(state.settings.rules||[]).map((r,i)=>`<div class="rule-row"><span>Se remetente contém <b>${escapeHtml(r.from)}</b> → ${escapeHtml(r.action)} ${r.value?escapeHtml(r.value):''}</span><button data-i="${i}">Excluir</button></div>`).join('');$$('#rulesList button').forEach(b=>b.onclick=()=>{state.settings.rules.splice(+b.dataset.i,1);renderRulesList()})}
async function saveSettings(){
  const s=state.settings;
  s.displayName=$('#setDisplayName').value.trim()||'Administrador';
  s.organization=$('#setOrganization').value.trim();
  if(s.organization) s.signatureCompany=s.organization;
  const unifiedPhone=($('#signaturePhone').value.trim()||$('#setPhone').value.trim()||'(31) 3772-6397');
  s.phone=unifiedPhone; s.signaturePhone=unifiedPhone;
  $('#setPhone').value=unifiedPhone; $('#signaturePhone').value=unifiedPhone;
  s.website=$('#setWebsite').value.trim();
  if(s.website) s.signatureSite=s.website;
  s.signatureName=$('#signatureName').value.trim()||s.displayName;
  s.signatureCompany=$('#signatureCompany').value.trim()||'GIFT Excellence';
  s.signatureCity=$('#signatureCity').value.trim();
  s.signatureSite=$('#signatureSite').value.trim();
  s.signatureNew=$('#signatureNew').checked;
  s.signatureReplies=$('#signatureReplies').checked;
  s.forwardEnabled=$('#forwardEnabled').checked;
  s.forwardAddress=$('#forwardAddress').value.trim();
  s.forwardKeepCopy=$('#forwardKeepCopy').checked;
  s.vacation=$('#vacationEnabled').checked;
  s.vacationText=$('#vacationText').value;
  s.vacationSubject=$('#vacationSubject').value;
  s.vacationStart=$('#vacationStart').value;
  s.vacationEnd=$('#vacationEnd').value;
  s.twoFactor=$('#twoFactor').checked;
  s.suspiciousLogin=$('#suspiciousLogin').checked;
  s.externalImages=$('#externalImages').checked;
  s.desktopNotifications=$('#desktopNotifications').checked;
  s.soundNotifications=$('#soundNotifications').checked;
  s.notifyImportant=$('#notifyImportant').checked;
  s.theme=$('#setTheme').value;
  s.density=$('#setDensity').value;
  s.preview=$('#setPreview').value;
  const saveBtn=$('#saveSettingsBtn');
  const oldText=saveBtn?.textContent;
  if(saveBtn){saveBtn.disabled=true;saveBtn.textContent='Salvando...'}
  try{
    await api('/api/settings',{method:'POST',body:JSON.stringify({
      displayName:s.displayName,signatureName:s.signatureName,signatureCompany:s.signatureCompany,
      signaturePhone:s.signaturePhone,signatureCity:s.signatureCity,signatureSite:s.signatureSite,
      signatureNew:s.signatureNew,signatureReplies:s.signatureReplies,theme:s.theme,density:s.density,
      vacation:s.vacation,vacationText:s.vacationText,notifications:s.desktopNotifications,sound:s.soundNotifications
    })});
    saveLocalSettings();
    applySettings();
    renderSignaturePreview();
    if(!$('#composeWindow').classList.contains('hidden')&&state.composeMode==='new')renderComposeSignature();
    document.body.classList.remove('settings-open');$('#settingsModal').classList.add('hidden');
    toast('Configurações salvas');
  }catch(err){
    toast('Não foi possível salvar: '+(err?.message||'erro de conexão'),true);
  }finally{
    if(saveBtn){saveBtn.disabled=false;saveBtn.textContent=oldText||'Salvar alterações'}
  }
}
function renderCustomFolders(){const el=$('#customFolders');el.innerHTML=(state.settings.customFolders||defaults.customFolders).map((n,i)=>`<div class="custom-folder"><span class="mail-icon">${mailIcon('file',16)}</span><b>${escapeHtml(n)}</b><button data-i="${i}" title="Remover">×</button></div>`).join('');$$('.custom-folder button').forEach(b=>b.onclick=e=>{e.stopPropagation();state.settings.customFolders.splice(+b.dataset.i,1);saveLocalSettings();renderCustomFolders()});$$('.custom-folder').forEach((r,i)=>r.onclick=()=>toast('Pasta "'+state.settings.customFolders[i]+'" pronta para receber regras e etiquetas.'))}
function showMenu(anchorOrX,yOrItems,maybeItems){const m=$('#contextMenu');const isAnchor=anchorOrX&&anchorOrX.getBoundingClientRect;const items=isAnchor?yOrItems:maybeItems;m.innerHTML=items.map((it,i)=>`<button data-i="${i}">${it.label}</button>`).join('');m.classList.remove('hidden');m.style.visibility='hidden';let x,y;if(isAnchor){const r=anchorOrX.getBoundingClientRect();x=r.left;y=r.bottom+6;}else{x=Number(anchorOrX)||12;y=Number(yOrItems)||12;}requestAnimationFrame(()=>{const w=m.offsetWidth||210,h=m.offsetHeight||200;m.style.left=Math.max(8,Math.min(x,innerWidth-w-8))+'px';m.style.top=Math.max(8,Math.min(y,innerHeight-h-8))+'px';m.style.visibility='visible'});$$('#contextMenu button').forEach(b=>b.onclick=async ev=>{ev.stopPropagation();m.classList.add('hidden');await items[+b.dataset.i].fn()})}
function showMessageContext(e,m){e.preventDefault();showMenu(e.clientX,e.clientY,[{label:'Responder',fn:()=>openCompose('reply',m)},{label:'Encaminhar',fn:()=>openCompose('forward',m)},{label:m.read?'Marcar como não lida':'Marcar como lida',fn:async()=>{state.selected=new Set([m.id]);await markSelected(!m.read)}},{label:'Arquivar',fn:async()=>{state.selected=new Set([m.id]);await moveSelected('archive')}},{label:'Mover para Spam',fn:async()=>{state.selected=new Set([m.id]);await moveSelected('spam')}},{label:state.folder==='trash'?'Excluir definitivamente':'Excluir',fn:()=>{state.selected=new Set([m.id]);requestDeleteSelected()}}])}
function showReaderContext(e,m){const r=e.currentTarget.getBoundingClientRect();showMenu(r.left,r.bottom,[{label:'Imprimir',fn:()=>window.print()},{label:'Marcar como não lida',fn:async()=>{state.selected=new Set([m.id]);await markSelected(false)}},{label:'Bloquear remetente',fn:()=>{const em=extractEmail(m.from||'');if(!state.settings.blocked.includes(em))state.settings.blocked.push(em);saveLocalSettings();toast('Remetente bloqueado')}},{label:state.folder==='trash'?'Excluir definitivamente':'Excluir',fn:()=>{state.selected=new Set([m.id]);requestDeleteSelected()}}])}

$('#loginForm').onsubmit=async e=>{
  e.preventDefault();
  try{
    const email=$('#loginEmail').value.trim();
    const r=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email,password:$('#loginPassword').value})});
    state.token=r.token;state.user=r.user||{email};
    if($('#rememberMe').checked){
      localStorage.setItem('giftToken',r.token);
      localStorage.setItem('giftRememberedEmail',email);
      sessionStorage.removeItem('giftToken');
    }else{
      sessionStorage.setItem('giftToken',r.token);
      localStorage.removeItem('giftToken');
      localStorage.removeItem('giftRememberedEmail');
    }
    await showApp();
  }catch(err){toast(err.message,true)}
};
$$('#folderNav .nav-item').forEach(b=>b.onclick=async()=>{$$('#folderNav .nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.folder=b.dataset.folder;state.current=null;$('#readerPane').classList.remove('mobile-open');document.body.classList.remove('mobile-reader-open','mobile-search-open');closeMobileSidebar();await loadMessages()});
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderMessages()});
$('#composeBtn').onclick=()=>{closeMobileSidebar();requestOpenCompose('new')};$('#replyBtn').onclick=()=>state.current?requestOpenCompose('reply',state.current):toast('Selecione uma mensagem');$('#replyAllBtn').onclick=()=>state.current?requestOpenCompose('replyAll',state.current):toast('Selecione uma mensagem');$('#forwardBtn').onclick=()=>state.current?requestOpenCompose('forward',state.current):toast('Selecione uma mensagem');
$('#searchInput').oninput=()=>{clearTimeout(window.__st);window.__st=setTimeout(loadMessages,250)};$('#advancedSearchBtn').onclick=()=>$('#advancedSearch').classList.toggle('hidden');$('#applyAdvancedSearch').onclick=renderMessages;$('#clearAdvancedSearch').onclick=()=>{$('#searchFrom').value=$('#searchTo').value=$('#searchSubject').value='';$('#searchHasAttachment').value='';renderMessages()};
$('#selectAll').onchange=e=>{for(const m of filteredMessages())e.target.checked?state.selected.add(m.id):state.selected.delete(m.id);renderMessages();updateMobileSelectionBar()};$('#deleteBtn').onclick=requestDeleteSelected;$('#emptyTrashActionBtn').onclick=requestEmptyTrash;$('#spamBtn').onclick=()=>moveSelected('spam');$('#archiveBtn').onclick=()=>moveSelected('archive');
async function setStarSelected(value=true){
  const ids=state.selected.size?[...state.selected]:(state.current?[state.current.id]:[]);
  if(!ids.length)return toast('Selecione ao menos uma mensagem',true);
  for(const id of ids){
    const m=state.messages.find(x=>x.id===id)||(state.current&&state.current.id===id?state.current:null);
    if(m&&m.starred!==value)await toggleStar(m);
  }
}
$('#moveBtn').onclick=e=>{e.stopPropagation();showMenu(e.currentTarget,['inbox','archive','spam','trash'].map(f=>({label:'Mover para '+folderNames[f],fn:()=>f==='trash'?requestDeleteSelected():moveSelected(f)})))};
$('#markBtn').onclick=e=>{e.stopPropagation();showMenu(e.currentTarget,[
  {label:'Marcar como lida',fn:()=>markSelected(true)},
  {label:'Marcar como não lida',fn:()=>markSelected(false)},
  {label:'Sinalizar com estrela',fn:()=>setStarSelected(true)},
  {label:'Remover estrela',fn:()=>setStarSelected(false)}
])};
$('#moreBtn').onclick=e=>{e.stopPropagation();showMenu(e.currentTarget,[
  {label:'Atualizar caixa',fn:refreshAll},
  {label:'Selecionar tudo',fn:()=>{$('#selectAll').checked=true;$('#selectAll').dispatchEvent(new Event('change'))}},
  {label:'Desmarcar tudo',fn:()=>{$('#selectAll').checked=false;state.selected.clear();renderMessages()}},
  {label:'Marcar tudo como lido',fn:()=>{state.selected=new Set(filteredMessages().map(x=>x.id));return markSelected(true)}},
  {label:'Marcar tudo como não lido',fn:()=>{state.selected=new Set(filteredMessages().map(x=>x.id));return markSelected(false)}}
])};
$('#readerMoreBtn').onclick=e=>{e.stopPropagation();if(state.current)showReaderContext(e,state.current)};$('#themeBtn').onclick=()=>{state.settings.theme=document.body.classList.contains('dark')?'light':'dark';saveLocalSettings();applySettings()};$('#mobileSearchBtn').onclick=e=>{e.stopPropagation();document.body.classList.toggle('mobile-search-open');if(document.body.classList.contains('mobile-search-open'))setTimeout(()=>$('#searchInput')?.focus(),40)};$('#profileTheme').onclick=()=>{$('#themeBtn').click();$('#profileMenu').classList.add('hidden')};$('#mobileComposeFab').onclick=()=>requestOpenCompose('new');
$('#profileBtn').onclick=e=>{e.stopPropagation();$('#profileMenu').classList.toggle('hidden')};document.addEventListener('click',e=>{$('#profileMenu').classList.add('hidden');$('#contextMenu').classList.add('hidden');if(innerWidth<820&&$('#sidebar').classList.contains('open')&&!$('#sidebar').contains(e.target)&&!$('#mobileMenu').contains(e.target))closeMobileSidebar()});$('#settingsBtn').onclick=()=>openSettings();$('#profileSettings').onclick=()=>openSettings('account');$('#profilePassword').onclick=()=>openSettings('password');
async function logout(){try{await api('/api/auth/logout',{method:'POST'})}catch{}state.token='';state.user=null;localStorage.removeItem('giftToken');sessionStorage.removeItem('giftToken');showLogin()}$('#profileLogout').onclick=requestLogout;
$('#newFolderBtn').onclick=()=>{const n=prompt('Nome da nova pasta:');if(n){state.settings.customFolders=state.settings.customFolders||[];if(!state.settings.customFolders.includes(n))state.settings.customFolders.push(n);saveLocalSettings();renderCustomFolders()}};
function closeMobileSidebar(){const sb=$('#sidebar'),ov=$('#mobileNavOverlay');sb?.classList.remove('open');ov?.classList.add('hidden');document.body.classList.remove('mobile-nav-open')}
function setMobileSidebar(open){const sb=$('#sidebar'),ov=$('#mobileNavOverlay');if(!sb)return;if(innerWidth>=820){closeMobileSidebar();return}sb.classList.toggle('open',!!open);ov?.classList.toggle('hidden',!open);document.body.classList.toggle('mobile-nav-open',!!open)}
$('#mobileMenu').onclick=e=>{e.stopPropagation();setMobileSidebar(!$('#sidebar').classList.contains('open'))};
$('#mobileNavOverlay')?.addEventListener('click',closeMobileSidebar);


$('#closeCompose').onclick=()=>openComposeDialog(composeHasContent()?'close-dirty':'close-empty');$('#minimizeCompose').onclick=()=>$('#composeWindow').classList.toggle('min');$('#maximizeCompose').onclick=()=>$('#composeWindow').classList.toggle('max');$('#ccBccBtn').onclick=()=>$('#ccBccFields').classList.toggle('hidden');
$$('.editor-toolbar [data-cmd]').forEach(b=>b.onclick=()=>{const cmd=b.dataset.cmd;if(cmd==='createLink'){const u=prompt('URL:');if(u)document.execCommand('createLink',false,u)}else if(cmd==='insertImage'){const u=prompt('URL da imagem:');if(u)document.execCommand('insertImage',false,u)}else if(cmd==='foreColor'){const c=prompt('Cor (ex.: #ff0000):','#111111');if(c)document.execCommand('foreColor',false,c)}else document.execCommand(cmd,false,null);focusMessageArea()});$('#fontFamily').onchange=e=>document.execCommand('fontName',false,e.target.value);$('#fontSize').onchange=e=>document.execCommand('fontSize',false,e.target.value==='12'?'2':e.target.value==='14'?'3':e.target.value==='16'?'4':'5');
$('#attachmentInput').onchange=async e=>{for(const f of [...e.target.files]){let data='';if(f.size<5*1024*1024)data=await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(f)});state.attachments.push({name:f.name,size:(f.size/1024).toFixed(0)+' KB',data})}renderComposeAttachments();e.target.value=''};
$('#insertDrive').onclick=()=>toast('Use o botão de anexo para selecionar arquivos deste computador.');$('#insertLink').onclick=()=>{const u=prompt('Cole o link:');if(u)document.execCommand('insertHTML',false,`<a href="${escapeHtml(u)}">${escapeHtml(u)}</a>`)};$('#insertEmoji').onclick=()=>document.execCommand('insertText',false,'🙂');$('#toggleSignature').onclick=()=>{const ed=$('#bodyEditor'),sig=ed.querySelector('[data-gift-signature]');sig?sig.remove():appendSignature()};$('#saveDraftBtn').onclick=()=>openComposeDialog('save-draft');$('#discardCompose').onclick=()=>openComposeDialog('discard');$('#sendBtn').onclick=()=>sendMessage('sent');$('#sendMenuBtn').onclick=()=>$('#scheduleMenu').classList.toggle('hidden');$$('#scheduleMenu [data-minutes]').forEach(b=>b.onclick=()=>{const d=new Date(Date.now()+(+b.dataset.minutes)*60000);sendMessage('scheduled',d.toISOString())});$('#customScheduleBtn').onclick=()=>{$('#hiddenDateTime').showPicker();$('#hiddenDateTime').onchange=()=>{const d=new Date($('#hiddenDateTime').value);if(d>new Date())sendMessage('scheduled',d.toISOString());else toast('Escolha uma data futura',true)}};
$('#composeDialogCancel').onclick=()=>{pendingComposeOpen=null;closeComposeDialog()};$('#composeDialogSecondary').onclick=performDialogSecondary;$('#composeDialogPrimary').onclick=performDialogPrimary;$('#composeDialog').addEventListener('click',e=>{if(e.target.id==='composeDialog'){pendingComposeOpen=null;closeComposeDialog()}});$('#actionDialogCancel').onclick=closeActionDialog;$('#actionDialogConfirm').onclick=confirmActionDialog;$('#actionDialog').addEventListener('click',e=>{if(e.target.id==='actionDialog')closeActionDialog()});
$('#closeSettings').onclick=$('#cancelSettings').onclick=()=>{document.body.classList.remove('settings-open');$('#settingsModal').classList.add('hidden')};$$('#settingsNav button').forEach(b=>b.onclick=()=>switchSettingsTab(b.dataset.tab));$('#saveSettingsBtn').onclick=saveSettings;['signatureName','signatureCompany','signaturePhone','signatureCity','signatureSite'].forEach(id=>$('#'+id)?.addEventListener('input',renderSignaturePreview));$('#setPhone')?.addEventListener('input',e=>{if($('#signaturePhone'))$('#signaturePhone').value=e.target.value;renderSignaturePreview()});$('#signaturePhone')?.addEventListener('input',e=>{if($('#setPhone'))$('#setPhone').value=e.target.value});$('#signatureLogoInput').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>4*1024*1024){e.target.value='';return toast('A imagem da assinatura deve ter no máximo 4 MB',true)}const data=await new Promise((ok,fail)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=fail;r.readAsDataURL(file)});try{const out=await api('/api/signature-logo',{method:'POST',body:JSON.stringify({name:file.name,type:file.type,data})});state.settings.signatureLogoUrl=out.url;saveLocalSettings();renderSignaturePreview();toast('Imagem da assinatura atualizada')}catch(err){toast(err.message,true)}e.target.value=''};$('#signatureLogoReset').onclick=async()=>{try{const out=await api('/api/signature-logo',{method:'DELETE'});state.settings.signatureLogoUrl=out.url;saveLocalSettings();renderSignaturePreview();toast('Logo padrão restaurado')}catch(e){toast(e.message,true)}};
$('#changePasswordBtn').onclick=async()=>{const c=$('#currentPassword').value,n=$('#newPassword').value,cf=$('#confirmPassword').value;if(n!==cf)return toast('As novas senhas não conferem',true);try{await api('/api/change-password',{method:'POST',body:JSON.stringify({current:c,next:n})});$('#currentPassword').value=$('#newPassword').value=$('#confirmPassword').value='';toast('Senha alterada com sucesso')}catch(e){toast(e.message,true)}};
$('#addAliasBtn').onclick=()=>{const v=$('#aliasInput').value.trim();if(v&&!state.settings.aliases.includes(v)){state.settings.aliases.push(v);$('#aliasInput').value='';renderAliasList()}};$('#addBlockedBtn').onclick=()=>{const v=$('#blockedInput').value.trim();if(v&&!state.settings.blocked.includes(v)){state.settings.blocked.push(v);$('#blockedInput').value='';renderBlockedList()}};$('#addRuleBtn').onclick=()=>{const from=$('#ruleFrom').value.trim(),action=$('#ruleAction').value,value=$('#ruleValue').value.trim();if(!from)return toast('Informe uma condição para a regra',true);state.settings.rules.push({from,action,value});$('#ruleFrom').value=$('#ruleValue').value='';renderRulesList()};$('#logoutOtherSessions').onclick=()=>toast('Outras sessões encerradas');$('#emptyTrashBtn').onclick=requestEmptyTrash;$('#emptySpamBtn').onclick=requestEmptySpam;
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput').focus()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='enter'&&!$('#composeWindow').classList.contains('hidden'))sendMessage('sent');if(e.key==='Escape'){$('#profileMenu').classList.add('hidden');$('#contextMenu').classList.add('hidden');document.body.classList.remove('mobile-search-open');closeMobileSidebar();if(innerWidth<820){$('#readerPane').classList.remove('mobile-open');document.body.classList.remove('mobile-reader-open')}}});window.addEventListener('resize',()=>{if(innerWidth>=820){closeMobileSidebar();$('#readerPane').classList.remove('mobile-open');document.body.classList.remove('mobile-reader-open','mobile-search-open')}});window.addEventListener('orientationchange',()=>setTimeout(()=>{closeMobileSidebar();if(innerWidth>=820)$('#readerPane').classList.remove('mobile-open')},120));
function initMobilePullToRefresh(){
  if(window.__giftPullRefreshInit)return;
  window.__giftPullRefreshInit=true;
  const app=$('#appView');
  if(!app)return;
  const indicator=document.createElement('div');
  indicator.id='pullRefreshIndicator';
  indicator.className='pull-refresh-indicator';
  indicator.innerHTML='<span class="pull-refresh-spinner"></span><b>Puxe para atualizar</b>';
  document.body.appendChild(indicator);
  let startY=0,pull=0,tracking=false,refreshing=false;
  const getScrollTop=(target)=>{
    const scroller=target?.closest?.('.message-list,.reader,.settings-content,.custom-folders');
    return scroller?scroller.scrollTop:0;
  };
  const canStart=(e)=>{
    if(innerWidth>=820||refreshing)return false;
    if($('#appView').classList.contains('hidden'))return false;
    if(!$('#composeWindow').classList.contains('hidden'))return false;
    if(!$('#settingsModal').classList.contains('hidden'))return false;
    if($('#sidebar').classList.contains('open'))return false;
    if(getScrollTop(e.target)>0)return false;
    return true;
  };
  app.addEventListener('touchstart',e=>{
    if(!canStart(e)||!e.touches?.length){tracking=false;return}
    startY=e.touches[0].clientY;pull=0;tracking=true;
    indicator.classList.remove('ready','refreshing');
    indicator.querySelector('b').textContent='Puxe para atualizar';
  },{passive:true});
  app.addEventListener('touchmove',e=>{
    if(!tracking||!e.touches?.length)return;
    const dy=e.touches[0].clientY-startY;
    if(dy<=0){pull=0;indicator.classList.remove('visible','ready');return}
    pull=Math.min(110,dy*.55);
    if(pull>6)e.preventDefault();
    indicator.style.setProperty('--pull',pull+'px');
    indicator.classList.add('visible');
    const ready=pull>=64;
    indicator.classList.toggle('ready',ready);
    indicator.querySelector('b').textContent=ready?'Solte para atualizar':'Puxe para atualizar';
  },{passive:false});
  app.addEventListener('touchend',async()=>{
    if(!tracking)return;
    tracking=false;
    if(pull>=64){
      refreshing=true;
      indicator.classList.add('visible','refreshing');
      indicator.classList.remove('ready');
      indicator.style.setProperty('--pull','54px');
      indicator.querySelector('b').textContent='Atualizando...';
      try{await refreshAll();indicator.querySelector('b').textContent='Atualizado'}
      catch(e){indicator.querySelector('b').textContent='Falha ao atualizar'}
      setTimeout(()=>{
        indicator.classList.remove('visible','refreshing','ready');
        indicator.style.setProperty('--pull','0px');
        refreshing=false;
      },650);
    }else{
      indicator.classList.remove('visible','ready');
      indicator.style.setProperty('--pull','0px');
    }
    pull=0;
  },{passive:true});
  app.addEventListener('touchcancel',()=>{
    tracking=false;pull=0;
    if(!refreshing){indicator.classList.remove('visible','ready');indicator.style.setProperty('--pull','0px')}
  },{passive:true});
}
initMobilePullToRefresh();
function initMobileHeaderAutoHide(){
  if(window.__giftHeaderAutoHideInit)return;
  window.__giftHeaderAutoHideInit=true;
  const list=$('#messageList');
  if(!list)return;
  let ticking=false;
  const showHeader=()=>document.body.classList.remove('mobile-header-hidden');
  const hideHeader=()=>document.body.classList.add('mobile-header-hidden');
  list.addEventListener('scroll',()=>{
    if(innerWidth>=820||ticking)return;
    ticking=true;
    requestAnimationFrame(()=>{
      const y=list.scrollTop;
      const locked=document.body.classList.contains('mobile-search-open')||
        document.body.classList.contains('settings-open')||
        !$('#profileMenu')?.classList.contains('hidden')||
        $('#sidebar')?.classList.contains('open');
      if(locked||y<=8)showHeader(); else hideHeader();
      ticking=false;
    });
  },{passive:true});
  $('#mobileSearchBtn')?.addEventListener('click',showHeader);
  $('#profileBtn')?.addEventListener('click',showHeader);
  $('#mobileMenu')?.addEventListener('click',showHeader);
  window.addEventListener('resize',()=>{if(innerWidth>=820)showHeader()});
  window.addEventListener('orientationchange',()=>setTimeout(showHeader,120));
}
initMobileHeaderAutoHide();
applyMailIcons();updateFolderActions();const rememberedEmail=localStorage.getItem('giftRememberedEmail');if(rememberedEmail)$('#loginEmail').value=rememberedEmail;if(state.token)showApp();else showLogin();
