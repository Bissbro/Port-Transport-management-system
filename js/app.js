const PINS={admin:'0000',captain:'1234'};
const BASE='/Port-Transport-management-system/';

const TRANSFER_TYPES=['Host','Guest','Front Office','Housekeeping','Engineering','Water Sports','F&B','HR','HOD','GM','RM'];

const STATUS={
  SCHEDULED:'scheduled',
  IN_PROGRESS:'in_progress',
  PENDING:'pending_review',
  VERIFIED:'verified',
  CORRECTION:'correction_needed'
};

const STATUS_LABELS={
  scheduled:'Scheduled',
  in_progress:'In progress',
  pending_review:'Pending review',
  verified:'Verified',
  correction_needed:'Correction needed'
};

const STATUS_CLASSES={
  scheduled:'badge-pending',
  in_progress:'badge-inprog',
  pending_review:'badge-warn',
  verified:'badge-active',
  correction_needed:'badge-correction'
};

function getSession(){return JSON.parse(localStorage.getItem('port_session')||'null');}
function setSession(role,name){localStorage.setItem('port_session',JSON.stringify({role,name,loggedIn:true}));}
function clearSession(){localStorage.removeItem('port_session');}

function requireAuth(allowedRoles){
  var s=getSession();
  if(!s||!s.loggedIn){window.location.href=BASE+'index.html';return null;}
  if(allowedRoles&&!allowedRoles.includes(s.role)){window.location.href=BASE+'dashboard.html';return null;}
  return s;
}

function load(key,def){
  try{var v=localStorage.getItem(key);return v?JSON.parse(v):def;}
  catch(e){return def;}
}
function save(key,val){localStorage.setItem(key,JSON.stringify(val));}

function todayStr(){return new Date().toISOString().split('T')[0];}

function fmtDate(d){
  if(!d)return'';
  var p=d.split('-');
  return p[2]+'.'+p[1]+'.'+p[0].slice(-2);
}

function nowTime(){
  return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
}

function nextId(arr){
  return arr.length?Math.max.apply(null,arr.map(function(x){return x.id||0;}))+1:1;
}

function initials(name){
  return name?name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase():'?';
}

function showToast(msg,type){
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.style.background=type==='error'?'#C53030':type==='success'?'#1B8C7D':'var(--navy)';
  t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},2500);
}

function logout(){clearSession();window.location.href=BASE+'index.html';}

function openModal(id){
  var el=document.getElementById(id||'modal-overlay');
  if(el)el.classList.add('open');
}
function closeModal(id){
  var el=document.getElementById(id||'modal-overlay');
  if(el)el.classList.remove('open');
}
function closeModalOutside(e,id){
  var el=document.getElementById(id||'modal-overlay');
  if(e.target===el)closeModal(id);
}

function statusBadge(s){
  return'<span class="badge '+(STATUS_CLASSES[s]||'badge-pending')+'">'+(STATUS_LABELS[s]||s)+'</span>';
}

function canEditTrip(session,trip){
  if(!session)return false;
  if(session.role==='admin')return true;
  return trip.captain===session.name&&trip.status===STATUS.CORRECTION;
}

function canStartTrip(session,trip){
  if(!session||session.role==='admin')return false;
  return trip.captain===session.name&&trip.status===STATUS.SCHEDULED;
}

function canEndTrip(session,trip){
  if(!session||session.role==='admin')return false;
  return trip.captain===session.name&&trip.status===STATUS.IN_PROGRESS;
}

function prevImg(input,prevId){
  if(!input.files||!input.files[0])return;
  var r=new FileReader();
  r.onload=function(e){
    var img=document.getElementById(prevId);
    if(img){img.src=e.target.result;img.style.display='block';}
  };
  r.readAsDataURL(input.files[0]);
}

/* Build crew multi-select from team */
function buildCrewSelect(selectedCrew){
  var team=load('port_team',[]);
  var selected=selectedCrew||[];
  return'<div id="crew-checkboxes" style="display:flex;flex-direction:column;gap:8px;max-height:180px;overflow-y:auto;border:0.5px solid var(--border);border-radius:8px;padding:10px">'
    +team.map(function(m){
      var checked=selected.indexOf(m.name)>=0;
      return'<label style="display:flex;align-items:center;gap:10px;font-size:14px;cursor:pointer">'
        +'<input type="checkbox" value="'+m.name+'" '+(checked?'checked':'')+' style="width:16px;height:16px;cursor:pointer">'
        +'<span>'+m.name+'</span>'
        +'<span style="font-size:11px;color:var(--text3)">'+m.title+'</span>'
        +'</label>';
    }).join('')
    +'</div>';
}

function getSelectedCrew(){
  var boxes=document.querySelectorAll('#crew-checkboxes input[type=checkbox]:checked');
  return Array.from(boxes).map(function(b){return b.value;});
}

/* Trip form HTML — used in schedule add/edit */
function buildTripForm(t,vessels,team){
  var isEdit=!!t;
  var types=TRANSFER_TYPES;
  var captains=team.filter(function(m){return m.title==='Captain';});
  return''
    +'<div class="form-row">'
    +'<div class="form-group"><label class="form-label">Date <span class="req">*</span></label>'
    +'<input class="form-input" type="date" id="tf-date" value="'+(isEdit?t.date:todayStr())+'"></div>'
    +'<div class="form-group"><label class="form-label">Departure time</label>'
    +'<input class="form-input" type="time" id="tf-dep" value="'+(isEdit?t.departure||'':'')+'"></div>'
    +'</div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label class="form-label">Vessel <span class="req">*</span></label>'
    +'<select class="form-select" id="tf-vessel" onchange="autoFillCaptain()">'
    +'<option value="">Select</option>'
    +vessels.map(function(v){return'<option'+(isEdit&&t.vessel===v.name?' selected':'')+'>'+v.name+'</option>';}).join('')
    +'</select></div>'
    +'<div class="form-group"><label class="form-label">Transfer type <span class="req">*</span></label>'
    +'<select class="form-select" id="tf-type">'
    +types.map(function(tp){return'<option'+(isEdit&&t.type===tp?' selected':'')+'>'+tp+'</option>';}).join('')
    +'</select></div>'
    +'</div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label class="form-label">From <span class="req">*</span></label>'
    +'<input class="form-input" id="tf-from" placeholder="e.g. Ithaafushi" value="'+(isEdit?t.from||'':'')+'"></div>'
    +'<div class="form-group"><label class="form-label">To <span class="req">*</span></label>'
    +'<input class="form-input" id="tf-to" placeholder="e.g. Velana Airport" value="'+(isEdit?t.to||'':'')+'"></div>'
    +'</div>'
    +'<div class="form-group"><label class="form-label">Purpose</label>'
    +'<input class="form-input" id="tf-purpose" placeholder="e.g. Guest departure" value="'+(isEdit?t.purpose||'':'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Captain <span class="req">*</span></label>'
    +'<select class="form-select" id="tf-captain">'
    +'<option value="">Select</option>'
    +captains.map(function(c){return'<option'+(isEdit&&t.captain===c.name?' selected':'')+'>'+c.name+'</option>';}).join('')
    +'</select></div>'
    +'<div class="form-group"><label class="form-label">Crew</label>'
    +buildCrewSelect(isEdit?t.crew:[])
    +'</div>'
    +'<div class="error-msg" id="tf-err"></div>'
    +'<button class="btn btn-primary" onclick="saveTrip('+(isEdit?t.id:-1)+')">'+(isEdit?'Update trip':'Schedule trip')+'</button>'
    +(isEdit&&session&&session.role==='admin'?'<button class="btn btn-danger" onclick="deleteTrip('+t.id+')">Delete trip</button>':'');
}

function autoFillCaptain(){
  var vesselName=document.getElementById('tf-vessel').value;
  var vessels=load('port_vessels',[]);
  var v=vessels.find(function(x){return x.name===vesselName;});
  if(v&&v.captain){
    var sel=document.getElementById('tf-captain');
    if(sel){
      for(var i=0;i<sel.options.length;i++){
        if(sel.options[i].text===v.captain){sel.selectedIndex=i;break;}
      }
    }
  }
}

function saveTrip(editId){
  var date=document.getElementById('tf-date').value;
  var vessel=document.getElementById('tf-vessel').value;
  var type=document.getElementById('tf-type').value;
  var from=document.getElementById('tf-from').value.trim();
  var to=document.getElementById('tf-to').value.trim();
  var purpose=document.getElementById('tf-purpose').value.trim();
  var captain=document.getElementById('tf-captain').value;
  var dep=document.getElementById('tf-dep').value;
  var crew=getSelectedCrew();
  var err=document.getElementById('tf-err');

  if(!date||!vessel||!from||!to||!captain){
    err.textContent='Fill in all required fields';err.classList.add('show');return;
  }
  err.classList.remove('show');

  var trips=load('port_trips',[]);
  if(editId>=0){
    var idx=trips.findIndex(function(t){return t.id===editId;});
    if(idx>=0){
      trips[idx].date=date;trips[idx].vessel=vessel;trips[idx].type=type;
      trips[idx].from=from;trips[idx].to=to;trips[idx].purpose=purpose;
      trips[idx].captain=captain;trips[idx].crew=crew;trips[idx].departure=dep;
    }
    save('port_trips',trips);
    showToast('Trip updated','success');
  } else {
    trips.push({
      id:nextId(trips),date:date,vessel:vessel,type:type,
      from:from,to:to,purpose:purpose,captain:captain,crew:crew,departure:dep,
      status:STATUS.SCHEDULED,
      fuelStart:undefined,fuelEnd:undefined,consumed:undefined,
      startTime:'',endTime:'',fuelStartImg:'',fuelEndImg:'',
      actual_from:'',actual_to:'',amendment_note:'',admin_note:''
    });
    save('port_trips',trips);
    showToast('Trip scheduled','success');
  }
  closeModal();
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

function deleteTrip(id){
  if(!confirm('Delete this trip?'))return;
  var trips=load('port_trips',[]).filter(function(t){return t.id!==id;});
  save('port_trips',trips);
  closeModal();
  showToast('Trip deleted');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

/* Trip card for lists */
function tripCardHTML(t,session,showActions){
  var route=(t.from&&t.to)?t.from+' → '+t.to:(t.route||'—');
  var actualRoute=(t.actual_from&&t.actual_to)?t.actual_from+' → '+t.actual_to:'';
  var crewStr=Array.isArray(t.crew)?t.crew.join(', '):t.crew||'';
  return'<div class="trip-card" onclick="openTripDetail('+t.id+')" style="cursor:pointer">'
    +'<div class="tc-head">'
    +'<div class="vessel-name">'+t.vessel+'</div>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +statusBadge(t.status)
    +'<span class="pill pill-date">'+fmtDate(t.date)+'</span>'
    +'</div></div>'
    +'<div class="tc-route">'+route+(t.purpose?' · '+t.purpose:'')+'</div>'
    +(actualRoute&&actualRoute!==route?'<div style="font-size:12px;color:var(--warning);margin-bottom:6px">Actual: '+actualRoute+'</div>':'')
    +'<div class="tc-meta">'
    +'<span class="pill '+(t.type==='Host'||t.type==='Guest'?'pill-'+(t.type==='Host'?'host':'guest'):'pill-dept')+'">'+t.type+'</span>'
    +(t.consumed!==undefined&&t.consumed!==null?'<span class="pill pill-fuel">'+t.consumed+'L</span>':'')
    +'<span class="pill pill-cap">'+t.captain+'</span>'
    +(t.departure?'<span class="pill pill-date"><i class="ti ti-clock" style="font-size:10px;margin-right:2px"></i>'+t.departure+'</span>':'')
    +(crewStr?'<span class="pill pill-date">'+crewStr+'</span>':'')
    +(t.status===STATUS.CORRECTION?'<span class="pill" style="background:#FFF5F5;color:#C53030">⚠ Correction needed</span>':'')
    +'</div>'
    +(showActions&&(canStartTrip(session,t)||canEndTrip(session,t))?
      '<div style="display:flex;gap:8px;margin-top:10px" onclick="event.stopPropagation()">'
      +(canStartTrip(session,t)?'<button class="btn btn-teal btn-sm" onclick="event.stopPropagation();openStartTrip('+t.id+')">Start trip</button>':'')
      +(canEndTrip(session,t)?'<button class="btn btn-primary btn-sm" onclick="event.stopPropagation();openEndTrip('+t.id+')">End trip</button>':'')
      +'</div>':'')
    +'</div>';
}

/* Trip detail modal */
function openTripDetail(id){
  var trips=load('port_trips',[]);
  var t=trips.find(function(x){return x.id===id;});
  if(!t)return;
  var s=getSession();
  var isAdmin=s&&s.role==='admin';
  var route=(t.from&&t.to)?t.from+' → '+t.to:(t.route||'—');
  var actualRoute=(t.actual_from&&t.actual_to)?t.actual_from+' → '+t.actual_to:'';
  var crewStr=Array.isArray(t.crew)?t.crew.join(', '):t.crew||'—';

  var el=document.getElementById('detail-modal-body');
  var titleEl=document.getElementById('detail-modal-title');
  if(!el)return;
  if(titleEl)titleEl.textContent=t.vessel+' · '+fmtDate(t.date);

  el.innerHTML=''
    +'<div style="margin-bottom:14px">'+statusBadge(t.status)+'</div>'
    +'<div class="trip-detail-section">'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Vessel</span><span class="trip-detail-val">'+t.vessel+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Type</span><span class="trip-detail-val">'+t.type+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">From</span><span class="trip-detail-val">'+(t.from||'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">To</span><span class="trip-detail-val">'+(t.to||'—')+'</span></div>'
    +(actualRoute?'<div class="trip-detail-row"><span class="trip-detail-label" style="color:var(--warning)">Actual route</span><span class="trip-detail-val" style="color:var(--warning)">'+actualRoute+'</span></div>':'')
    +'<div class="trip-detail-row"><span class="trip-detail-label">Purpose</span><span class="trip-detail-val">'+(t.purpose||'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Captain</span><span class="trip-detail-val">'+t.captain+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Crew</span><span class="trip-detail-val">'+crewStr+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Departure</span><span class="trip-detail-val">'+(t.departure||'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Return</span><span class="trip-detail-val">'+(t.endTime||'—')+'</span></div>'
    +'</div>'
    +'<div class="trip-detail-section">'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Fuel start</span><span class="trip-detail-val">'+(t.fuelStart!==undefined&&t.fuelStart!==null?t.fuelStart+'L':'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Fuel end</span><span class="trip-detail-val">'+(t.fuelEnd!==undefined&&t.fuelEnd!==null?t.fuelEnd+'L':'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Consumed</span><span class="trip-detail-val" style="color:var(--teal);font-weight:700">'+(t.consumed!==undefined&&t.consumed!==null?t.consumed+'L':'—')+'</span></div>'
    +(t.fuelStartImg?'<div style="margin-top:10px"><div style="font-size:12px;color:var(--text3);margin-bottom:4px">Start meter</div><img src="'+t.fuelStartImg+'" class="fuel-meter-img"></div>':'')
    +(t.fuelEndImg?'<div style="margin-top:10px"><div style="font-size:12px;color:var(--text3);margin-bottom:4px">End meter</div><img src="'+t.fuelEndImg+'" class="fuel-meter-img"></div>':'')
    +'</div>'
    +(t.amendment_note?'<div class="trip-detail-section"><div style="font-size:12px;color:var(--text3);margin-bottom:4px">Amendment note</div><div style="font-size:13px">'+t.amendment_note+'</div></div>':'')
    +(t.admin_note?'<div class="trip-detail-section" style="border-color:#FEB2B2"><div style="font-size:12px;color:var(--danger);margin-bottom:6px">⚠ Admin note</div><div style="font-size:13px">'+t.admin_note+'</div></div>':'')
    +'<div class="action-bar" style="flex-wrap:wrap">'
    +(canStartTrip(s,t)?'<button class="btn btn-teal" style="flex:1" onclick="closeModal(\'detail-modal\');openStartTrip('+t.id+')">Start trip</button>':'')
    +(canEndTrip(s,t)?'<button class="btn btn-primary" style="flex:1" onclick="closeModal(\'detail-modal\');openEndTrip('+t.id+')">End trip</button>':'')
    +(isAdmin&&t.status===STATUS.PENDING?'<button class="btn btn-teal" style="flex:1" onclick="verifyTrip('+t.id+')">Verify</button>':'')
    +(isAdmin&&t.status===STATUS.PENDING?'<button class="btn btn-danger" style="flex:1" onclick="requestCorrection('+t.id+')">Request correction</button>':'')
    +(isAdmin?'<button class="btn" style="flex:1;border:0.5px solid var(--border)" onclick="closeModal(\'detail-modal\');openEditTrip('+t.id+')">Edit</button>':'')
    +(isAdmin?'<button class="btn btn-danger" style="flex:1" onclick="deleteTrip('+t.id+')">Delete</button>':'')
    +'</div>';

  openModal('detail-modal');
}

function openEditTrip(id){
  var trips=load('port_trips',[]);
  var t=trips.find(function(x){return x.id===id;});
  if(!t)return;
  var vessels=load('port_vessels',[]);
  var team=load('port_team',[]);
  var el=document.getElementById('form-modal-body');
  var titleEl=document.getElementById('form-modal-title');
  if(titleEl)titleEl.textContent='Edit trip';
  if(el)el.innerHTML=buildTripForm(t,vessels,team);
  openModal('form-modal');
}

function openStartTrip(id){
  var trips=load('port_trips',[]);
  var t=trips.find(function(x){return x.id===id;});
  if(!t)return;
  var el=document.getElementById('form-modal-body');
  var titleEl=document.getElementById('form-modal-title');
  if(titleEl)titleEl.textContent='Start trip — '+t.vessel;
  if(el)el.innerHTML=''
    +'<div class="card" style="margin-bottom:16px">'
    +'<div style="font-size:13px;color:var(--text2)">'+t.from+' → '+t.to+'</div>'
    +'<div style="font-size:12px;color:var(--text3);margin-top:4px">'+t.type+(t.purpose?' · '+t.purpose:'')+'</div>'
    +'</div>'
    +'<div class="form-group"><label class="form-label">Fuel start (L) <span class="req">*</span></label>'
    +'<input class="form-input" type="number" id="st-fuel" placeholder="e.g. 120" inputmode="decimal"></div>'
    +'<div class="form-group"><label class="form-label">Departure time</label>'
    +'<input class="form-input" type="time" id="st-time" value="'+nowTime()+'"></div>'
    +'<div class="form-group"><label class="form-label">Start meter photo</label>'
    +'<div class="photo-upload" onclick="document.getElementById(\'st-img-input\').click()">'
    +'<i class="ti ti-camera" style="font-size:22px;display:block;margin-bottom:6px"></i>Upload photo</div>'
    +'<input type="file" id="st-img-input" accept="image/*" style="display:none" onchange="prevImg(this,\'st-img-prev\')">'
    +'<img id="st-img-prev" class="fuel-meter-img" style="display:none"></div>'
    +'<div class="error-msg" id="st-err"></div>'
    +'<button class="btn btn-teal" onclick="confirmStart('+id+')">Confirm start</button>';
  openModal('form-modal');
}

function confirmStart(id){
  var fuel=parseFloat(document.getElementById('st-fuel').value);
  if(isNaN(fuel)){
    var e=document.getElementById('st-err');e.textContent='Enter fuel reading';e.classList.add('show');return;
  }
  var time=document.getElementById('st-time').value;
  var imgEl=document.getElementById('st-img-prev');
  var img=imgEl&&imgEl.src&&imgEl.src.startsWith('data:')?imgEl.src:'';
  var trips=load('port_trips',[]);
  var idx=trips.findIndex(function(t){return t.id===id;});
  if(idx<0)return;
  trips[idx].status=STATUS.IN_PROGRESS;
  trips[idx].fuelStart=parseFloat(fuel);
  trips[idx].startTime=time;
  trips[idx].departure=time;
  trips[idx].fuelStartImg=img;
  save('port_trips',trips);
  closeModal('form-modal');
  showToast('Trip started','success');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

function openEndTrip(id){
  var trips=load('port_trips',[]);
  var t=trips.find(function(x){return x.id===id;});
  if(!t)return;
  var el=document.getElementById('form-modal-body');
  var titleEl=document.getElementById('form-modal-title');
  if(titleEl)titleEl.textContent='End trip — '+t.vessel;
  if(el)el.innerHTML=''
    +'<div class="card" style="margin-bottom:16px">'
    +'<div style="font-size:13px;color:var(--text2)">'+t.from+' → '+t.to+'</div>'
    +'<div style="font-size:13px;font-weight:600;margin-top:6px">Fuel start: '+t.fuelStart+'L</div>'
    +'</div>'
    +'<div class="form-group"><label class="form-label">Fuel end (L) <span class="req">*</span></label>'
    +'<input class="form-input" type="number" id="en-fuel" placeholder="e.g. 96" inputmode="decimal" oninput="liveCalc('+t.fuelStart+')">'
    +'</div>'
    +'<div class="fuel-calc"><div class="fc-val" id="en-consumed">— L</div><div class="fc-lbl">Fuel consumed</div></div>'
    +'<div class="form-group"><label class="form-label">Return time</label>'
    +'<input class="form-input" type="time" id="en-time" value="'+nowTime()+'"></div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label class="form-label">Actual from</label>'
    +'<input class="form-input" id="en-from" placeholder="If changed" value="'+( t.from||'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Actual to</label>'
    +'<input class="form-input" id="en-to" placeholder="If changed" value="'+(t.to||'')+'"></div>'
    +'</div>'
    +'<div class="form-group"><label class="form-label">Amendment note</label>'
    +'<textarea class="form-textarea" id="en-note" placeholder="Any changes or notes..."></textarea></div>'
    +'<div class="form-group"><label class="form-label">End meter photo</label>'
    +'<div class="photo-upload" onclick="document.getElementById(\'en-img-input\').click()">'
    +'<i class="ti ti-camera" style="font-size:22px;display:block;margin-bottom:6px"></i>Upload photo</div>'
    +'<input type="file" id="en-img-input" accept="image/*" style="display:none" onchange="prevImg(this,\'en-img-prev\')">'
    +'<img id="en-img-prev" class="fuel-meter-img" style="display:none"></div>'
    +'<div class="error-msg" id="en-err"></div>'
    +'<button class="btn btn-primary" onclick="confirmEnd('+id+','+t.fuelStart+')">Submit for review</button>';
  openModal('form-modal');
}

function liveCalc(fuelStart){var fuelStartNum=parseFloat(fuelStart)||0;
  var end=parseFloat(document.getElementById('en-fuel').value)||0;
  var c=Math.max(0,end-fuelStartNum);
  document.getElementById('en-consumed').textContent=c>0?c+'L':'— L';
}

function confirmEnd(id,fuelStart){
  var fuelEnd=parseFloat(document.getElementById('en-fuel').value);
  if(isNaN(fuelEnd)){
    var e=document.getElementById('en-err');e.textContent='Enter fuel reading';e.classList.add('show');return;
  }
  var consumed=Math.max(0,fuelEnd-parseFloat(fuelStart));
  var time=document.getElementById('en-time').value;
  var actualFrom=document.getElementById('en-from').value.trim();
  var actualTo=document.getElementById('en-to').value.trim();
  var note=document.getElementById('en-note').value.trim();
  var imgEl=document.getElementById('en-img-prev');
  var img=imgEl&&imgEl.src&&imgEl.src.startsWith('data:')?imgEl.src:'';
  var trips=load('port_trips',[]);
  var idx=trips.findIndex(function(t){return t.id===id;});
  if(idx<0)return;
  trips[idx].status=STATUS.PENDING;
  trips[idx].fuelEnd=fuelEnd;
  trips[idx].consumed=consumed;
  trips[idx].endTime=time;
  trips[idx].actual_from=actualFrom;
  trips[idx].actual_to=actualTo;
  trips[idx].amendment_note=note;
  trips[idx].fuelEndImg=img;
  save('port_trips',trips);
  closeModal('form-modal');
  showToast('Submitted for review','success');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

function verifyTrip(id){
  var trips=load('port_trips',[]);
  var idx=trips.findIndex(function(t){return t.id===id;});
  if(idx<0)return;
  trips[idx].status=STATUS.VERIFIED;
  trips[idx].admin_note='';
  save('port_trips',trips);
  closeModal('detail-modal');
  showToast('Trip verified','success');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

function requestCorrection(id){
  var note=prompt('Correction note for captain:');
  if(note===null)return;
  var trips=load('port_trips',[]);
  var idx=trips.findIndex(function(t){return t.id===id;});
  if(idx<0)return;
  trips[idx].status=STATUS.CORRECTION;
  trips[idx].admin_note=note;
  save('port_trips',trips);
  closeModal('detail-modal');
  showToast('Correction requested');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

/* Default data */
function initData(){
  if(!localStorage.getItem('port_vessels'))save('port_vessels',[
    {id:1,name:'Swell',status:'active',captain:'Jailam',regNo:'MV-001',capacity:12,fuelCapacity:300,notes:'',photo:''},
    {id:2,name:'Drift',status:'docked',captain:'Amdhah',regNo:'MV-002',capacity:10,fuelCapacity:250,notes:'',photo:''},
    {id:3,name:'Crest',status:'active',captain:'Rauf',regNo:'MV-003',capacity:8,fuelCapacity:200,notes:'',photo:''}
  ]);
  if(!localStorage.getItem('port_team'))save('port_team',[
    {id:1,name:'Jailam',title:'Captain',vessel:'Swell',phone:''},
    {id:2,name:'Amdhah',title:'Captain',vessel:'Drift',phone:''},
    {id:3,name:'Rauf',title:'Captain',vessel:'Crest',phone:''},
    {id:4,name:'Usaid',title:'Guest Relations',vessel:'',phone:''}
  ]);
  if(!localStorage.getItem('port_trips'))save('port_trips',[]);
  if(!localStorage.getItem('port_checklists'))save('port_checklists',[]);
}
