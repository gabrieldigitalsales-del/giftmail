const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state={token:localStorage.getItem('giftToken')||'',user:null,messages:[],folder:'inbox',filter:'all',selected:new Set(),current:null,settings:{},attachments:[],composeMode:'new'};
const defaults={customFolders:['Comercial','Compras','Engenharia','Financeiro','Projetos'],aliases:[],blocked:[],rules:[],organization:'GIFT Excellence',phone:'(31) 3773-1234',website:'www.giftexcellence.com.br',signatureName:'',signatureCompany:'GIFT Excellence',signaturePhone:'(31) 3773-1234',signatureCity:'Sete Lagoas - MG',signatureSite:'www.giftexcellence.com.br',signatureLogoUrl:'https://giftmail.vercel.app/assets/gift-logo.png',signatureNew:true,signatureReplies:false,forwardEnabled:false,forwardAddress:'',forwardKeepCopy:true,twoFactor:false,suspiciousLogin:true,externalImages:false,desktopNotifications:true,soundNotifications:false,notifyImportant:true,preview:'split'};
function toast(msg,error=false){const d=document.createElement('div');d.className='toast'+(error?' error':'');d.textContent=msg;$('#toast').appendChild(d);setTimeout(()=>d.remove(),2800)}
async function api(url,opt={}){opt.headers={...(opt.headers||{}),'Content-Type':'application/json'};if(state.token)opt.headers.Authorization='Bearer '+state.token;const r=await fetch(url,opt);let j={};try{j=await r.json()}catch{}if(!r.ok)throw new Error(j.error||'Falha na operação');return j}
function initials(s=''){const clean=s.replace(/<.*?>/g,'').trim();const words=clean.split(/\s+/).filter(Boolean);return (words[0]?.[0]||'G')+(words[1]?.[0]||'');}
function nameFromAddress(s=''){const m=s.match(/^([^<]+)</);if(m)return m[1].trim();const x=s.replace(/[<>]/g,'').split('@')[0]||s;return x.split(/[._-]/).map(a=>a.charAt(0).toUpperCase()+a.slice(1)).join(' ')}
function formatDate(s){const d=new Date(s),now=new Date();if(d.toDateString()===now.toDateString())return d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});const y=new Date(now);y.setDate(y.getDate()-1);if(d.toDateString()===y.toDateString())return 'Ontem';return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
function stripHtml(h=''){const d=document.createElement('div');d.innerHTML=h;return d.textContent||d.innerText||''}
function splitEmails(v=''){return v.split(/[;,]/).map(x=>x.trim()).filter(Boolean)}
function saveLocalSettings(){localStorage.setItem('giftUiSettings',JSON.stringify({...defaults,...state.settings}))}
function loadLocalSettings(){try{return JSON.parse(localStorage.getItem('giftUiSettings')||'{}')}catch{return {}}}
function showLogin(){$('#loginView').classList.remove('hidden');$('#appView').classList.add('hidden')}
async function showApp(){$('#loginView').classList.add('hidden');$('#appView').classList.remove('hidden');try{const srv=await api('/api/settings');state.settings={...defaults,...loadLocalSettings(),...srv};state.user={email:state.settings.email||'admin@giftexcellence.com.br',name:state.settings.displayName||'Administrador'};applySettings();await refreshAll()}catch(e){localStorage.removeItem('giftToken');state.token='';showLogin();toast(e.message,true)}}
function applySettings(){const s=state.settings;$('#profileName').textContent=s.displayName||'Administrador';$('#profileEmail').textContent=s.email||'';$('#menuEmail').textContent=s.email||'';$('#profileAvatar').textContent=initials(s.displayName||s.email).slice(0,1);document.body.classList.toggle('compact',s.density==='compact');let theme=s.theme||'light';if(theme==='system')theme=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.body.classList.toggle('dark',theme==='dark');$('#themeBtn').textContent=theme==='dark'?'☾':'☼';renderCustomFolders()}
async function refreshAll(){await Promise.all([loadSummary(),loadMessages(),loadStorage()])}
function formatBytes(bytes){if(bytes==null||Number.isNaN(Number(bytes)))return '—';const n=Number(bytes);if(n<1024)return n+' B';const u=['KB','MB','GB','TB'];let v=n/1024,i=0;while(v>=1024&&i<u.length-1){v/=1024;i++}return v.toLocaleString('pt-BR',{maximumFractionDigits:v<10?2:1})+' '+u[i]}
async function loadStorage(){try{const st=await api('/api/storage');const used=st.usedBytes;const limit=st.limitBytes;const pct=(used!=null&&limit)?Math.max(0,Math.min(100,(used/limit)*100)):0;$('#storageText').textContent=used==null?('Aguardando provedor · '+formatBytes(limit)):(formatBytes(used)+' de '+formatBytes(limit));$('#storageBar').style.width=pct+'%';const bu=$('#storageUsedBig'),bl=$('#storageLimitBig'),bb=$('#storageBarBig'),src=$('#storageSource');if(bu)bu.textContent=used==null?'Aguardando dados':formatBytes(used);if(bl)bl.textContent='de '+formatBytes(limit)+' utilizados';if(bb)bb.style.width=pct+'%';if(src)src.textContent=st.real?(st.source==='local-demo'?'Uso real dos dados locais atuais':'Uso informado pelo servidor/provedor'):'Preparado para receber a quota real do provedor';}catch(e){$('#storageText').textContent='Indisponível';$('#storageBar').style.width='0%';}}
async function loadSummary(){const s=await api('/api/summary');for(const k of ['inbox','starred','sent','drafts','scheduled','archive','spam','trash']){const el=$('#count-'+k);if(el)el.textContent=s[k]||''}}
async function loadMessages(){state.selected.clear();$('#selectAll').checked=false;let folder=state.folder;let q=$('#searchInput').value.trim();let data=await api('/api/messages?folder='+encodeURIComponent(folder)+(q?'&q='+encodeURIComponent(q):''));state.messages=data;renderMessages();if(!state.current&&folder==='inbox'&&data.length)await openMessage(data[0])}
function filteredMessages(){let m=[...state.messages];if(state.filter==='unread')m=m.filter(x=>!x.read);if(state.filter==='starred')m=m.filter(x=>x.starred);const f=$('#searchFrom').value.trim().toLowerCase(),t=$('#searchTo').value.trim().toLowerCase(),sub=$('#searchSubject').value.trim().toLowerCase(),att=$('#searchHasAttachment').value;if(f)m=m.filter(x=>(x.from||'').toLowerCase().includes(f));if(t)m=m.filter(x=>(x.to||[]).join(' ').toLowerCase().includes(t));if(sub)m=m.filter(x=>(x.subject||'').toLowerCase().includes(sub));if(att==='yes')m=m.filter(x=>(x.attachments||[]).length);if(att==='no')m=m.filter(x=>!(x.attachments||[]).length);return m}
function renderMessages(){const list=$('#messageList');list.innerHTML='';const msgs=filteredMessages();$('#folderLabel').textContent=folderNames[state.folder]||state.folder;for(const m of msgs){const card=document.createElement('div');card.className='message-card'+(!m.read?' unread':'')+(state.current?.id===m.id?' active':'');card.dataset.id=m.id;const nm=nameFromAddress(m.from||m.to?.[0]||'');card.innerHTML=`<input class="msg-check" type="checkbox" ${state.selected.has(m.id)?'checked':''}><div class="sender-avatar">${initials(nm).slice(0,2)}</div><div class="message-main"><div class="sender-line"><strong>${escapeHtml(nm)}</strong><time>${formatDate(m.date)}</time></div><div class="subject-line"><b>${escapeHtml(m.subject||'(sem assunto)')}</b>${(m.attachments||[]).length?' <span>⌕</span>':''}</div><div class="preview-line">${escapeHtml(stripHtml(m.body||''))}</div></div><button class="star-btn ${m.starred?'on':''}">${m.starred?'★':'☆'}</button>`;card.addEventListener('click',e=>{if(e.target.matches('.msg-check,.star-btn'))return;openMessage(m)});card.querySelector('.msg-check').onchange=e=>{e.target.checked?state.selected.add(m.id):state.selected.delete(m.id)};card.querySelector('.star-btn').onclick=()=>toggleStar(m);card.oncontextmenu=e=>showMessageContext(e,m);list.appendChild(card)}if(!msgs.length)list.innerHTML='<div class="empty-reader" style="height:240px"><div class="mail-illustration">⌕</div><h2>Nenhum e-mail</h2><p>Não encontramos mensagens nesta visualização.</p></div>'}
function escapeHtml(s=''){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
async function openMessage(m){state.current=m;if(!m.read){try{await api('/api/messages/'+m.id,{method:'PATCH',body:JSON.stringify({action:'read',value:true,folder:m.folder})});m.read=true;loadSummary()}catch{}}renderMessages();renderReader(m);if(innerWidth<820)$('#readerPane').classList.add('mobile-open')}
function renderReader(m){const nm=nameFromAddress(m.from||'');const reader=$('#readerPane');const at=(m.attachments||[]).map(a=>`<span class="attachment-chip"><b>${(a.name||'FILE').split('.').pop().toUpperCase()}</b><span>${escapeHtml(a.name||'Anexo')}<small>${a.size?' · '+escapeHtml(String(a.size)):''}</small></span><button class="attachment-download" data-id="${escapeHtml(a.id||'')}" data-name="${escapeHtml(a.name||'anexo')}" title="Baixar">⇩</button></span>`).join('');reader.innerHTML=`<div class="reader-head"><div class="reader-title"><h1>${escapeHtml(m.subject||'(sem assunto)')}</h1><span class="folder-pill">${escapeHtml(folderNames[m.folder]||m.folder||'')}</span></div><div class="reader-meta"><div class="sender-avatar">${initials(nm).slice(0,2)}</div><div><strong>${escapeHtml(nm)} <small style="display:inline">&lt;${escapeHtml(extractEmail(m.from||''))}&gt;</small></strong><small>para mim · ${new Date(m.date).toLocaleString('pt-BR')}</small></div><div class="reader-meta-actions"><button class="inlineStar">${m.starred?'★':'☆'}</button><button class="inlineReply">↶</button><button class="inlineMore">⋮</button></div></div></div><div class="reader-body">${normalizeBody(m.body)}</div>${at?`<div class="attachment-block"><strong>${m.attachments.length} anexo${m.attachments.length>1?'s':''}</strong><div style="margin-top:10px">${at}</div></div>`:''}`;reader.querySelector('.inlineStar').onclick=()=>toggleStar(m);reader.querySelector('.inlineReply').onclick=()=>openCompose('reply',m);reader.querySelector('.inlineMore').onclick=e=>{e.stopPropagation();showReaderContext(e,m)};reader.querySelectorAll('.attachment-download').forEach(b=>b.onclick=()=>downloadAttachment(b.dataset.id,b.dataset.name))}
function extractEmail(s=''){const m=s.match(/<([^>]+)>/);return m?m[1]:s}
function normalizeBody(body=''){if(/<\w+/.test(body))return body;return body.split(/\n{2,}/).map(p=>`<p>${escapeHtml(p).replace(/\n/g,'<br>')}</p>`).join('')}
async function downloadAttachment(id,name='anexo'){try{const r=await fetch('/api/attachments/'+encodeURIComponent(id),{headers:{Authorization:'Bearer '+state.token}});if(!r.ok)throw new Error('Não foi possível baixar o anexo');const blob=await r.blob(),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500)}catch(e){toast(e.message,true)}}
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
function requestOpenCompose(mode='new',message=null){
  const w=$('#composeWindow');
  if(!w.classList.contains('hidden')&&composeHasContent()){
    pendingComposeOpen={mode,message};openComposeDialog('replace');return;
  }
  openCompose(mode,message);
}
function openCompose(mode='new',m=null){
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
  const phone=escapeHtml(settings.signaturePhone||'(31) 3773-1234');
  const city=escapeHtml(settings.signatureCity||'Sete Lagoas - MG');
  const site=escapeHtml(settings.signatureSite||'www.giftexcellence.com.br');
  const email=escapeHtml(settings.email||'');
  const logo=escapeHtml(settings.signatureLogoUrl||'https://giftmail.vercel.app/assets/gift-logo.png');
  const hrefSite=/^https?:\/\//i.test(settings.signatureSite||'')?(settings.signatureSite||''):'https://'+(settings.signatureSite||'www.giftexcellence.com.br');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:620px;width:100%;margin-top:24px"><tr><td style="padding:6px 24px 14px 0;width:210px;vertical-align:middle"><img src="${logo}" alt="GIFT Excellence" style="display:block;max-width:195px;max-height:95px;width:auto;height:auto;border:0"></td><td style="border-left:2px solid #ff161f;padding:6px 0 14px 24px;vertical-align:middle"><div style="font-size:16px;font-weight:700;line-height:1.25;margin-bottom:2px">${name}</div><div style="font-size:12px;color:#666;margin-bottom:9px">${company}</div><div style="font-size:12px;line-height:1.65">☎&nbsp; ${phone}<br>✉&nbsp; ${email}<br>●&nbsp; ${city}</div></td></tr><tr><td colspan="2" style="border-top:2px solid #ff161f;padding-top:9px"><a href="${escapeHtml(hrefSite)}" style="font-size:12px;color:#ff161f;text-decoration:none">${site}</a></td></tr></table>`;
}
function ensureMessageArea(){return $('#bodyEditor')}
function focusMessageArea(){requestAnimationFrame(()=>$('#bodyEditor').focus())}
function appendSignature(){const ed=$('#bodyEditor');ed.querySelector('[data-gift-signature]')?.remove();const sig=document.createElement('div');sig.className='signature-block';sig.dataset.giftSignature='1';sig.setAttribute('contenteditable','false');sig.innerHTML=signatureHtml();if(ed.innerHTML.trim())ed.insertAdjacentHTML('beforeend','<br><br>');ed.appendChild(sig);focusMessageArea()}
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
function fillSettings(){const s=state.settings;$('#settingsLoggedEmail').textContent=s.email||'';$('#setDisplayName').value=s.displayName||'';$('#setEmail').value=s.email||'';$('#setOrganization').value=s.organization||'';$('#setPhone').value=s.phone||'';$('#setWebsite').value=s.website||'';$('#signatureName').value=s.signatureName||s.displayName||'';$('#signatureCompany').value=s.signatureCompany||'GIFT Excellence';$('#signaturePhone').value=s.signaturePhone||s.phone||'(31) 3773-1234';$('#signatureCity').value=s.signatureCity||'Sete Lagoas - MG';$('#signatureSite').value=s.signatureSite||s.website||'www.giftexcellence.com.br';$('#signatureNew').checked=s.signatureNew!==false;$('#signatureReplies').checked=!!s.signatureReplies;$('#forwardEnabled').checked=!!s.forwardEnabled;$('#forwardAddress').value=s.forwardAddress||'';$('#forwardKeepCopy').checked=s.forwardKeepCopy!==false;$('#vacationEnabled').checked=!!s.vacation;$('#vacationText').value=s.vacationText||'';$('#vacationSubject').value=s.vacationSubject||'Resposta automática';$('#vacationStart').value=s.vacationStart||'';$('#vacationEnd').value=s.vacationEnd||'';$('#twoFactor').checked=!!s.twoFactor;$('#suspiciousLogin').checked=s.suspiciousLogin!==false;$('#externalImages').checked=!!s.externalImages;$('#desktopNotifications').checked=s.desktopNotifications!==false;$('#soundNotifications').checked=!!s.soundNotifications;$('#notifyImportant').checked=s.notifyImportant!==false;$('#setTheme').value=s.theme||'light';$('#setDensity').value=s.density||'comfortable';$('#setPreview').value=s.preview||'split';renderAliasList();renderBlockedList();renderRulesList();renderSignaturePreview()}
function openSettings(tab='account'){$('#settingsModal').classList.remove('hidden');fillSettings();switchSettingsTab(tab)}
function switchSettingsTab(tab){if(tab==='storage')loadStorage();$$('#settingsNav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));$$('.settings-panel').forEach(p=>p.classList.toggle('active',p.dataset.panel===tab))}
function renderAliasList(){$('#aliasList').innerHTML=(state.settings.aliases||[]).map((x,i)=>`<span class="chip">${escapeHtml(x)}<button data-i="${i}">×</button></span>`).join('');$$('#aliasList button').forEach(b=>b.onclick=()=>{state.settings.aliases.splice(+b.dataset.i,1);renderAliasList()})}
function renderBlockedList(){$('#blockedList').innerHTML=(state.settings.blocked||[]).map((x,i)=>`<span class="chip">${escapeHtml(x)}<button data-i="${i}">×</button></span>`).join('');$$('#blockedList button').forEach(b=>b.onclick=()=>{state.settings.blocked.splice(+b.dataset.i,1);renderBlockedList()})}
function renderRulesList(){$('#rulesList').innerHTML=(state.settings.rules||[]).map((r,i)=>`<div class="rule-row"><span>Se remetente contém <b>${escapeHtml(r.from)}</b> → ${escapeHtml(r.action)} ${r.value?escapeHtml(r.value):''}</span><button data-i="${i}">Excluir</button></div>`).join('');$$('#rulesList button').forEach(b=>b.onclick=()=>{state.settings.rules.splice(+b.dataset.i,1);renderRulesList()})}
async function saveSettings(){const s=state.settings;s.displayName=$('#setDisplayName').value.trim()||'Administrador';s.organization=$('#setOrganization').value.trim();s.phone=$('#setPhone').value.trim();s.website=$('#setWebsite').value.trim();s.signatureName=$('#signatureName').value.trim()||s.displayName;s.signatureCompany=$('#signatureCompany').value.trim()||'GIFT Excellence';s.signaturePhone=$('#signaturePhone').value.trim();s.signatureCity=$('#signatureCity').value.trim();s.signatureSite=$('#signatureSite').value.trim();s.signatureNew=$('#signatureNew').checked;s.signatureReplies=$('#signatureReplies').checked;s.forwardEnabled=$('#forwardEnabled').checked;s.forwardAddress=$('#forwardAddress').value.trim();s.forwardKeepCopy=$('#forwardKeepCopy').checked;s.vacation=$('#vacationEnabled').checked;s.vacationText=$('#vacationText').value;s.vacationSubject=$('#vacationSubject').value;s.vacationStart=$('#vacationStart').value;s.vacationEnd=$('#vacationEnd').value;s.twoFactor=$('#twoFactor').checked;s.suspiciousLogin=$('#suspiciousLogin').checked;s.externalImages=$('#externalImages').checked;s.desktopNotifications=$('#desktopNotifications').checked;s.soundNotifications=$('#soundNotifications').checked;s.notifyImportant=$('#notifyImportant').checked;s.theme=$('#setTheme').value;s.density=$('#setDensity').value;s.preview=$('#setPreview').value;saveLocalSettings();try{await api('/api/settings',{method:'POST',body:JSON.stringify({displayName:s.displayName,signatureName:s.signatureName,signatureCompany:s.signatureCompany,signaturePhone:s.signaturePhone,signatureCity:s.signatureCity,signatureSite:s.signatureSite,signatureNew:s.signatureNew,signatureReplies:s.signatureReplies,theme:s.theme,density:s.density,vacation:s.vacation,vacationText:s.vacationText,notifications:s.desktopNotifications,sound:s.soundNotifications})})}catch(e){return toast(e.message,true)}applySettings();$('#settingsModal').classList.add('hidden');toast('Configurações salvas')}
function renderCustomFolders(){const el=$('#customFolders');el.innerHTML=(state.settings.customFolders||defaults.customFolders).map((n,i)=>`<div class="custom-folder"><span>▰</span><b>${escapeHtml(n)}</b><button data-i="${i}" title="Remover">×</button></div>`).join('');$$('.custom-folder button').forEach(b=>b.onclick=e=>{e.stopPropagation();state.settings.customFolders.splice(+b.dataset.i,1);saveLocalSettings();renderCustomFolders()});$$('.custom-folder').forEach((r,i)=>r.onclick=()=>toast('Pasta "'+state.settings.customFolders[i]+'" pronta para receber regras e etiquetas.'))}
function showMenu(anchorOrX,yOrItems,maybeItems){const m=$('#contextMenu');const isAnchor=anchorOrX&&anchorOrX.getBoundingClientRect;const items=isAnchor?yOrItems:maybeItems;m.innerHTML=items.map((it,i)=>`<button data-i="${i}">${it.label}</button>`).join('');m.classList.remove('hidden');m.style.visibility='hidden';let x,y;if(isAnchor){const r=anchorOrX.getBoundingClientRect();x=r.left;y=r.bottom+6;}else{x=Number(anchorOrX)||12;y=Number(yOrItems)||12;}requestAnimationFrame(()=>{const w=m.offsetWidth||210,h=m.offsetHeight||200;m.style.left=Math.max(8,Math.min(x,innerWidth-w-8))+'px';m.style.top=Math.max(8,Math.min(y,innerHeight-h-8))+'px';m.style.visibility='visible'});$$('#contextMenu button').forEach(b=>b.onclick=async ev=>{ev.stopPropagation();m.classList.add('hidden');await items[+b.dataset.i].fn()})}
function showMessageContext(e,m){e.preventDefault();showMenu(e.clientX,e.clientY,[{label:'Responder',fn:()=>openCompose('reply',m)},{label:'Encaminhar',fn:()=>openCompose('forward',m)},{label:m.read?'Marcar como não lida':'Marcar como lida',fn:async()=>{state.selected=new Set([m.id]);await markSelected(!m.read)}},{label:'Arquivar',fn:async()=>{state.selected=new Set([m.id]);await moveSelected('archive')}},{label:'Mover para Spam',fn:async()=>{state.selected=new Set([m.id]);await moveSelected('spam')}},{label:'Excluir',fn:async()=>{state.selected=new Set([m.id]);await moveSelected('trash')}}])}
function showReaderContext(e,m){const r=e.currentTarget.getBoundingClientRect();showMenu(r.left,r.bottom,[{label:'Imprimir',fn:()=>window.print()},{label:'Marcar como não lida',fn:async()=>{state.selected=new Set([m.id]);await markSelected(false)}},{label:'Bloquear remetente',fn:()=>{const em=extractEmail(m.from||'');if(!state.settings.blocked.includes(em))state.settings.blocked.push(em);saveLocalSettings();toast('Remetente bloqueado')}}])}

$('#loginForm').onsubmit=async e=>{e.preventDefault();try{const r=await api('/api/auth/login',{method:'POST',body:JSON.stringify({email:$('#loginEmail').value.trim(),password:$('#loginPassword').value})});state.token=r.token;localStorage.setItem('giftToken',r.token);await showApp()}catch(err){toast(err.message,true)}};
$$('#folderNav .nav-item').forEach(b=>b.onclick=async()=>{$$('#folderNav .nav-item').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.folder=b.dataset.folder;state.current=null;$('#readerPane').classList.remove('mobile-open');await loadMessages()});
$$('.tab').forEach(b=>b.onclick=()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderMessages()});
$('#composeBtn').onclick=()=>requestOpenCompose('new');$('#replyBtn').onclick=()=>state.current?requestOpenCompose('reply',state.current):toast('Selecione uma mensagem');$('#replyAllBtn').onclick=()=>state.current?requestOpenCompose('replyAll',state.current):toast('Selecione uma mensagem');$('#forwardBtn').onclick=()=>state.current?requestOpenCompose('forward',state.current):toast('Selecione uma mensagem');
$('#searchInput').oninput=()=>{clearTimeout(window.__st);window.__st=setTimeout(loadMessages,250)};$('#advancedSearchBtn').onclick=()=>$('#advancedSearch').classList.toggle('hidden');$('#applyAdvancedSearch').onclick=renderMessages;$('#clearAdvancedSearch').onclick=()=>{$('#searchFrom').value=$('#searchTo').value=$('#searchSubject').value='';$('#searchHasAttachment').value='';renderMessages()};
$('#selectAll').onchange=e=>{for(const m of filteredMessages())e.target.checked?state.selected.add(m.id):state.selected.delete(m.id);renderMessages()};$('#deleteBtn').onclick=()=>moveSelected('trash');$('#spamBtn').onclick=()=>moveSelected('spam');$('#archiveBtn').onclick=()=>moveSelected('archive');
async function setStarSelected(value=true){
  const ids=state.selected.size?[...state.selected]:(state.current?[state.current.id]:[]);
  if(!ids.length)return toast('Selecione ao menos uma mensagem',true);
  for(const id of ids){
    const m=state.messages.find(x=>x.id===id)||(state.current&&state.current.id===id?state.current:null);
    if(m&&m.starred!==value)await toggleStar(m);
  }
}
$('#moveBtn').onclick=e=>{e.stopPropagation();showMenu(e.currentTarget,['inbox','archive','spam','trash'].map(f=>({label:'Mover para '+folderNames[f],fn:()=>moveSelected(f)})))};
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
$('#readerMoreBtn').onclick=e=>{e.stopPropagation();if(state.current)showReaderContext(e,state.current)};$('#themeBtn').onclick=()=>{state.settings.theme=document.body.classList.contains('dark')?'light':'dark';saveLocalSettings();applySettings()};
$('#profileBtn').onclick=e=>{e.stopPropagation();$('#profileMenu').classList.toggle('hidden')};document.addEventListener('click',()=>{$('#profileMenu').classList.add('hidden');$('#contextMenu').classList.add('hidden')});$('#settingsBtn').onclick=()=>openSettings();$('#profileSettings').onclick=()=>openSettings('account');$('#profilePassword').onclick=()=>openSettings('password');
async function logout(){try{await api('/api/auth/logout',{method:'POST'})}catch{}state.token='';localStorage.removeItem('giftToken');showLogin()}$('#profileLogout').onclick=logout;
$('#newFolderBtn').onclick=()=>{const n=prompt('Nome da nova pasta:');if(n){state.settings.customFolders=state.settings.customFolders||[];if(!state.settings.customFolders.includes(n))state.settings.customFolders.push(n);saveLocalSettings();renderCustomFolders()}};
$('#mobileMenu').onclick=()=>$('#sidebar').classList.toggle('open');
$('#closeCompose').onclick=()=>openComposeDialog(composeHasContent()?'close-dirty':'close-empty');$('#minimizeCompose').onclick=()=>$('#composeWindow').classList.toggle('min');$('#maximizeCompose').onclick=()=>$('#composeWindow').classList.toggle('max');$('#ccBccBtn').onclick=()=>$('#ccBccFields').classList.toggle('hidden');
$$('.editor-toolbar [data-cmd]').forEach(b=>b.onclick=()=>{const cmd=b.dataset.cmd;if(cmd==='createLink'){const u=prompt('URL:');if(u)document.execCommand('createLink',false,u)}else if(cmd==='insertImage'){const u=prompt('URL da imagem:');if(u)document.execCommand('insertImage',false,u)}else if(cmd==='foreColor'){const c=prompt('Cor (ex.: #ff0000):','#111111');if(c)document.execCommand('foreColor',false,c)}else document.execCommand(cmd,false,null);focusMessageArea()});$('#fontFamily').onchange=e=>document.execCommand('fontName',false,e.target.value);$('#fontSize').onchange=e=>document.execCommand('fontSize',false,e.target.value==='12'?'2':e.target.value==='14'?'3':e.target.value==='16'?'4':'5');
$('#attachmentInput').onchange=async e=>{for(const f of [...e.target.files]){let data='';if(f.size<5*1024*1024)data=await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(f)});state.attachments.push({name:f.name,size:(f.size/1024).toFixed(0)+' KB',data})}renderComposeAttachments();e.target.value=''};
$('#insertDrive').onclick=()=>toast('Use o botão de anexo para selecionar arquivos deste computador.');$('#insertLink').onclick=()=>{const u=prompt('Cole o link:');if(u)document.execCommand('insertHTML',false,`<a href="${escapeHtml(u)}">${escapeHtml(u)}</a>`)};$('#insertEmoji').onclick=()=>document.execCommand('insertText',false,'🙂');$('#toggleSignature').onclick=()=>{const ed=$('#bodyEditor'),sig=ed.querySelector('[data-gift-signature]');sig?sig.remove():appendSignature()};$('#saveDraftBtn').onclick=()=>openComposeDialog('save-draft');$('#discardCompose').onclick=()=>openComposeDialog('discard');$('#sendBtn').onclick=()=>sendMessage('sent');$('#sendMenuBtn').onclick=()=>$('#scheduleMenu').classList.toggle('hidden');$$('#scheduleMenu [data-minutes]').forEach(b=>b.onclick=()=>{const d=new Date(Date.now()+(+b.dataset.minutes)*60000);sendMessage('scheduled',d.toISOString())});$('#customScheduleBtn').onclick=()=>{$('#hiddenDateTime').showPicker();$('#hiddenDateTime').onchange=()=>{const d=new Date($('#hiddenDateTime').value);if(d>new Date())sendMessage('scheduled',d.toISOString());else toast('Escolha uma data futura',true)}};
$('#composeDialogCancel').onclick=()=>{pendingComposeOpen=null;closeComposeDialog()};$('#composeDialogSecondary').onclick=performDialogSecondary;$('#composeDialogPrimary').onclick=performDialogPrimary;$('#composeDialog').addEventListener('click',e=>{if(e.target.id==='composeDialog'){pendingComposeOpen=null;closeComposeDialog()}});
$('#closeSettings').onclick=$('#cancelSettings').onclick=()=>$('#settingsModal').classList.add('hidden');$('#settingsNav button').forEach(b=>b.onclick=()=>switchSettingsTab(b.dataset.tab));$('#saveSettingsBtn').onclick=saveSettings;['signatureName','signatureCompany','signaturePhone','signatureCity','signatureSite'].forEach(id=>$('#'+id)?.addEventListener('input',renderSignaturePreview));$('#signatureLogoInput').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;if(file.size>4*1024*1024){e.target.value='';return toast('A imagem da assinatura deve ter no máximo 4 MB',true)}const data=await new Promise((ok,fail)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=fail;r.readAsDataURL(file)});try{const out=await api('/api/signature-logo',{method:'POST',body:JSON.stringify({name:file.name,type:file.type,data})});state.settings.signatureLogoUrl=out.url;saveLocalSettings();renderSignaturePreview();toast('Imagem da assinatura atualizada')}catch(err){toast(err.message,true)}e.target.value=''};$('#signatureLogoReset').onclick=async()=>{try{const out=await api('/api/signature-logo',{method:'DELETE'});state.settings.signatureLogoUrl=out.url;saveLocalSettings();renderSignaturePreview();toast('Logo padrão restaurado')}catch(e){toast(e.message,true)}};
$('#changePasswordBtn').onclick=async()=>{const c=$('#currentPassword').value,n=$('#newPassword').value,cf=$('#confirmPassword').value;if(n!==cf)return toast('As novas senhas não conferem',true);try{await api('/api/change-password',{method:'POST',body:JSON.stringify({current:c,next:n})});$('#currentPassword').value=$('#newPassword').value=$('#confirmPassword').value='';toast('Senha alterada com sucesso')}catch(e){toast(e.message,true)}};
$('#addAliasBtn').onclick=()=>{const v=$('#aliasInput').value.trim();if(v&&!state.settings.aliases.includes(v)){state.settings.aliases.push(v);$('#aliasInput').value='';renderAliasList()}};$('#addBlockedBtn').onclick=()=>{const v=$('#blockedInput').value.trim();if(v&&!state.settings.blocked.includes(v)){state.settings.blocked.push(v);$('#blockedInput').value='';renderBlockedList()}};$('#addRuleBtn').onclick=()=>{const from=$('#ruleFrom').value.trim(),action=$('#ruleAction').value,value=$('#ruleValue').value.trim();if(!from)return toast('Informe uma condição para a regra',true);state.settings.rules.push({from,action,value});$('#ruleFrom').value=$('#ruleValue').value='';renderRulesList()};$('#logoutOtherSessions').onclick=()=>toast('Outras sessões encerradas');$('#emptyTrashBtn').onclick=async()=>{const trash=await api('/api/messages?folder=trash');for(const m of trash)await api('/api/messages/'+m.id,{method:'DELETE'});toast('Lixeira esvaziada');loadSummary()};$('#emptySpamBtn').onclick=async()=>{const spam=await api('/api/messages?folder=spam');for(const m of spam)await api('/api/messages/'+m.id,{method:'DELETE'});toast('Spam esvaziado');loadSummary()};
window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#searchInput').focus()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='enter'&&!$('#composeWindow').classList.contains('hidden'))sendMessage('sent');if(e.key==='Escape'){$('#profileMenu').classList.add('hidden');$('#contextMenu').classList.add('hidden');if(innerWidth<820)$('#readerPane').classList.remove('mobile-open')}});
if(state.token)showApp();else showLogin();
