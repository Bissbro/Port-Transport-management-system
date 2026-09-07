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

function todayStr(){return new Date().toISOString().split('T')[0];}

function fmtDate(d){
  if(!d)return'';
  var p=d.split('-');
  return p[2]+'.'+p[1]+'.'+p[0].slice(-2);
}

function nowTime(){
  return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
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

function buildCrewSelect(selectedCrew,teamList){
  var selected=selectedCrew||[];
  if(!teamList||!teamList.length)return'<div style="font-size:13px;color:var(--text3);padding:10px">No team members found</div>';
  return'<div id="crew-checkboxes" style="display:flex;flex-direction:column;gap:8px;max-height:180px;overflow-y:auto;border:0.5px solid var(--border);border-radius:8px;padding:10px">'
    +teamList.map(function(m){
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

function buildTripForm(t,vessels,team){
  var isEdit=!!t;
  var captains=team.filter(function(m){return m.title==='Captain';});
  return''
    +'<div class="form-row">'
    +'<div class="form-group"><label class="form-label">Date <span class="req">*</span></label>'
    +'<input class="form-input" type="date" id="tf-date" value="'+(isEdit?t.date:todayStr())+'"></div>'
    +'<div class="form-group"><label class="form-label">Departure</label>'
    +'<input class="form-input" type="time" id="tf-dep" value="'+(isEdit?t.departure||'':'')+'"></div>'
    +'</div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label class="form-label">Vessel <span class="req">*</span></label>'
    +'<select class="form-select" id="tf-vessel" onchange="autoFillCaptain()">'
    +'<option value="">Select</option>'
    +vessels.map(function(v){return'<option'+(isEdit&&t.vessel===v.name?' selected':'')+'>'+v.name+'</option>';}).join('')
    +'</select></div>'
    +'<div class="form-group"><label class="form-label">Type <span class="req">*</span></label>'
    +'<select class="form-select" id="tf-type">'
    +TRANSFER_TYPES.map(function(tp){return'<option'+(isEdit&&t.type===tp?' selected':'')+'>'+tp+'</option>';}).join('')
    +'</select></div>'
    +'</div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label class="form-label">From <span class="req">*</span></label>'
    +'<input class="form-input" id="tf-from" placeholder="e.g. Ithaafushi" value="'+(isEdit?t.from_location||'':'')+'"></div>'
    +'<div class="form-group"><label class="form-label">To <span class="req">*</span></label>'
    +'<input class="form-input" id="tf-to" placeholder="e.g. Velana Airport" value="'+(isEdit?t.to_location||'':'')+'"></div>'
    +'</div>'
    +'<div class="form-group"><label class="form-label">Purpose</label>'
    +'<input class="form-input" id="tf-purpose" placeholder="e.g. Guest departure" value="'+(isEdit?t.purpose||'':'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Captain <span class="req">*</span></label>'
    +'<select class="form-select" id="tf-captain">'
    +'<option value="">Select</option>'
    +captains.map(function(c){return'<option'+(isEdit&&t.captain===c.name?' selected':'')+'>'+c.name+'</option>';}).join('')
    +'</select></div>'
    +'<div class="form-group"><label class="form-label">Crew</label>'
    +buildCrewSelect(isEdit?t.crew:[],team)
    +'</div>'
    +'<div class="error-msg" id="tf-err"></div>'
    +'<button class="btn btn-primary" onclick="saveTrip('+(isEdit?t.id:-1)+')">'+(isEdit?'Update trip':'Schedule trip')+'</button>'
    +(isEdit?'<button class="btn btn-danger" style="margin-top:8px" onclick="deleteTrip('+t.id+')">Delete trip</button>':'');
}

function autoFillCaptain(){
  var vesselName=document.getElementById('tf-vessel').value;
  window._vessels=window._vessels||[];
  var v=window._vessels.find(function(x){return x.name===vesselName;});
  if(v&&v.captain){
    var sel=document.getElementById('tf-captain');
    if(sel){
      for(var i=0;i<sel.options.length;i++){
        if(sel.options[i].text===v.captain){sel.selectedIndex=i;break;}
      }
    }
  }
}

async function saveTrip(editId){
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

  var btn=document.querySelector('#form-modal .btn-primary');
  if(btn){btn.textContent='Saving...';btn.disabled=true;}

  var data={
    date:date,vessel:vessel,type:type,
    from_location:from,to_location:to,
    purpose:purpose,captain:captain,
    crew:crew,departure:dep,
    status:STATUS.SCHEDULED
  };

  if(editId>=0){
    await dbUpdate('trips',editId,data);
    showToast('Trip updated','success');
  } else {
    await dbInsert('trips',data);
    showToast('Trip scheduled','success');
  }

  closeModal('form-modal');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

async function deleteTrip(id){
  if(!confirm('Delete this trip?'))return;
  await dbDelete('trips',id);
  closeModal('detail-modal');
  closeModal('form-modal');
  showToast('Trip deleted');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

function tripCardHTML(t,session,showActions){
  var route=(t.from_location&&t.to_location)?t.from_location+' → '+t.to_location:'—';
  var actualRoute=(t.actual_from&&t.actual_to&&(t.actual_from!==t.from_location||t.actual_to!==t.to_location))?t.actual_from+' → '+t.actual_to:'';
  var crewStr=Array.isArray(t.crew)?t.crew.join(', '):t.crew||'';
  return'<div class="trip-card" onclick="openTripDetail('+t.id+')" style="cursor:pointer">'
    +'<div class="tc-head">'
    +'<div class="vessel-name">'+t.vessel+'</div>'
    +'<div style="display:flex;gap:6px;align-items:center">'
    +statusBadge(t.status)
    +'<span class="pill pill-date">'+fmtDate(t.date)+'</span>'
    +'</div></div>'
    +'<div class="tc-route">'+route+(t.purpose?' · '+t.purpose:'')+'</div>'
    +(actualRoute?'<div style="font-size:12px;color:var(--warning);margin-bottom:6px">Actual: '+actualRoute+'</div>':'')
    +'<div class="tc-meta">'
    +'<span class="pill '+(t.type==='Host'?'pill-host':t.type==='Guest'?'pill-guest':'pill-dept')+'">'+t.type+'</span>'
    +(t.consumed!=null?'<span class="pill pill-fuel">'+t.consumed+'L</span>':'')
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

async function openTripDetail(id){
  var trips=await dbGet('trips','&id=eq.'+id);
  var t=trips[0];
  if(!t)return;
  var s=getSession();
  var isAdmin=s&&s.role==='admin';
  var route=(t.from_location&&t.to_location)?t.from_location+' → '+t.to_location:'—';
  var actualRoute=(t.actual_from&&t.actual_to&&(t.actual_from!==t.from_location||t.actual_to!==t.to_location))?t.actual_from+' → '+t.actual_to:'';
  var crewStr=Array.isArray(t.crew)?t.crew.join(', '):t.crew||'—';

  document.getElementById('detail-modal-title').textContent=t.vessel+' · '+fmtDate(t.date);
  document.getElementById('detail-modal-body').innerHTML=''
    +'<div style="margin-bottom:14px">'+statusBadge(t.status)+'</div>'
    +'<div class="trip-detail-section">'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Vessel</span><span class="trip-detail-val">'+t.vessel+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Type</span><span class="trip-detail-val">'+t.type+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">From</span><span class="trip-detail-val">'+(t.from_location||'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">To</span><span class="trip-detail-val">'+(t.to_location||'—')+'</span></div>'
    +(actualRoute?'<div class="trip-detail-row"><span class="trip-detail-label" style="color:var(--warning)">Actual route</span><span class="trip-detail-val" style="color:var(--warning)">'+actualRoute+'</span></div>':'')
    +'<div class="trip-detail-row"><span class="trip-detail-label">Purpose</span><span class="trip-detail-val">'+(t.purpose||'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Captain</span><span class="trip-detail-val">'+t.captain+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Crew</span><span class="trip-detail-val">'+crewStr+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Departure</span><span class="trip-detail-val">'+(t.departure||'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Return</span><span class="trip-detail-val">'+(t.end_time||'—')+'</span></div>'
    +'</div>'
    +'<div class="trip-detail-section">'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Fuel start</span><span class="trip-detail-val">'+(t.fuel_start!=null?t.fuel_start+'L':'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Fuel end</span><span class="trip-detail-val">'+(t.fuel_end!=null?t.fuel_end+'L':'—')+'</span></div>'
    +'<div class="trip-detail-row"><span class="trip-detail-label">Consumed</span><span class="trip-detail-val" style="color:var(--teal);font-weight:700">'+(t.consumed!=null?t.consumed+'L':'—')+'</span></div>'
    +(t.fuel_start_img?'<div style="margin-top:10px"><div style="font-size:12px;color:var(--text3);margin-bottom:4px">Start meter</div><img src="'+t.fuel_start_img+'" class="fuel-meter-img"></div>':'')
    +(t.fuel_end_img?'<div style="margin-top:10px"><div style="font-size:12px;color:var(--text3);margin-bottom:4px">End meter</div><img src="'+t.fuel_end_img+'" class="fuel-meter-img"></div>':'')
    +'</div>'
    +(t.amendment_note?'<div class="trip-detail-section"><div style="font-size:12px;color:var(--text3);margin-bottom:4px">Amendment note</div><div style="font-size:13px">'+t.amendment_note+'</div></div>':'')
    +(t.admin_note?'<div class="trip-detail-section" style="border-color:#FEB2B2"><div style="font-size:12px;color:var(--danger);margin-bottom:6px">⚠ Admin note</div><div style="font-size:13px">'+t.admin_note+'</div></div>':'')
    +'<div class="action-bar">'
    +(canStartTrip(s,t)?'<button class="btn btn-teal" style="flex:1" onclick="closeModal(\'detail-modal\');openStartTrip('+t.id+')">Start trip</button>':'')
    +(canEndTrip(s,t)?'<button class="btn btn-primary" style="flex:1" onclick="closeModal(\'detail-modal\');openEndTrip('+t.id+')">End trip</button>':'')
    +(isAdmin&&t.status===STATUS.PENDING?'<button class="btn btn-teal" style="flex:1" onclick="verifyTrip('+t.id+')">Verify</button>':'')
    +(isAdmin&&t.status===STATUS.PENDING?'<button class="btn btn-danger" style="flex:1" onclick="requestCorrection('+t.id+')">Request correction</button>':'')
    +(isAdmin?'<button class="btn" style="flex:1;border:0.5px solid var(--border)" onclick="closeModal(\'detail-modal\');openEditTrip('+t.id+')">Edit</button>':'')
    +(isAdmin?'<button class="btn btn-danger" style="flex:1" onclick="deleteTrip('+t.id+')">Delete</button>':'')
    +'</div>';
  openModal('detail-modal');
}

async function openEditTrip(id){
  var trips=await dbGet('trips','&id=eq.'+id);
  var t=trips[0];if(!t)return;
  var vessels=await dbGet('vessels');
  var team=await dbGet('team');
  window._vessels=vessels;
  document.getElementById('form-modal-title').textContent='Edit trip';
  document.getElementById('form-modal-body').innerHTML=buildTripForm(t,vessels,team);
  openModal('form-modal');
}

async function openStartTrip(id){
  var trips=await dbGet('trips','&id=eq.'+id);
  var t=trips[0];if(!t)return;
  document.getElementById('form-modal-title').textContent='Start trip — '+t.vessel;
  document.getElementById('form-modal-body').innerHTML=''
    +'<div class="card" style="margin-bottom:16px">'
    +'<div style="font-size:13px;color:var(--text2)">'+(t.from_location||'')+ ' → '+(t.to_location||'')+'</div>'
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

async function confirmStart(id){
  var fuel=parseFloat(document.getElementById('st-fuel').value);
  if(isNaN(fuel)){
    var e=document.getElementById('st-err');e.textContent='Enter fuel reading';e.classList.add('show');return;
  }
  var time=document.getElementById('st-time').value;
  var imgEl=document.getElementById('st-img-prev');
  var img=imgEl&&imgEl.src&&imgEl.src.startsWith('data:')?imgEl.src:'';
  var btn=document.querySelector('#form-modal .btn-teal');
  if(btn){btn.textContent='Saving...';btn.disabled=true;}
  await dbUpdate('trips',id,{
    status:STATUS.IN_PROGRESS,
    fuel_start:fuel,
    start_time:time,
    departure:time,
    fuel_start_img:img
  });
  closeModal('form-modal');
  showToast('Trip started','success');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

async function openEndTrip(id){
  var trips=await dbGet('trips','&id=eq.'+id);
  var t=trips[0];if(!t)return;
  var fs=parseFloat(t.fuel_start)||0;
  document.getElementById('form-modal-title').textContent='End trip — '+t.vessel;
  document.getElementById('form-modal-body').innerHTML=''
    +'<div class="card" style="margin-bottom:16px">'
    +'<div style="font-size:13px;color:var(--text2)">'+(t.from_location||'')+' → '+(t.to_location||'')+'</div>'
    +'<div style="font-size:13px;font-weight:600;margin-top:6px">Fuel start: '+fs+'L</div>'
    +'</div>'
    +'<input type="hidden" id="en-fuelstart-hidden" value="'+fs+'">'
    +'<div class="form-group"><label class="form-label">Fuel end (L) <span class="req">*</span></label>'
    +'<input class="form-input" type="number" id="en-fuel" placeholder="e.g. 96" inputmode="decimal" oninput="liveCalc()"></div>'
    +'<div class="fuel-calc"><div class="fc-val" id="en-consumed">— L</div><div class="fc-lbl">Fuel consumed</div></div>'
    +'<div class="form-group"><label class="form-label">Return time</label>'
    +'<input class="form-input" type="time" id="en-time" value="'+nowTime()+'"></div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label class="form-label">Actual from</label>'
    +'<input class="form-input" id="en-from" placeholder="If changed" value="'+(t.from_location||'')+'"></div>'
    +'<div class="form-group"><label class="form-label">Actual to</label>'
    +'<input class="form-input" id="en-to" placeholder="If changed" value="'+(t.to_location||'')+'"></div>'
    +'</div>'
    +'<div class="form-group"><label class="form-label">Amendment note</label>'
    +'<textarea class="form-textarea" id="en-note" placeholder="Any changes or notes..."></textarea></div>'
    +'<div class="form-group"><label class="form-label">End meter photo</label>'
    +'<div class="photo-upload" onclick="document.getElementById(\'en-img-input\').click()">'
    +'<i class="ti ti-camera" style="font-size:22px;display:block;margin-bottom:6px"></i>Upload photo</div>'
    +'<input type="file" id="en-img-input" accept="image/*" style="display:none" onchange="prevImg(this,\'en-img-prev\')">'
    +'<img id="en-img-prev" class="fuel-meter-img" style="display:none"></div>'
    +'<div class="error-msg" id="en-err"></div>'
    +'<button class="btn btn-primary" onclick="confirmEnd('+id+')">Submit for review</button>';
  openModal('form-modal');
}

function liveCalc(){
  var fuelStartNum=parseFloat(document.getElementById('en-fuelstart-hidden').value)||0;
  var end=parseFloat(document.getElementById('en-fuel').value)||0;
  var c=Math.max(0,end-fuelStartNum);
  document.getElementById('en-consumed').textContent=c>0?c+'L':'— L';
}

async function confirmEnd(id){
  var fuelEnd=parseFloat(document.getElementById('en-fuel').value);
  var fuelStart=parseFloat(document.getElementById('en-fuelstart-hidden').value)||0;
  if(isNaN(fuelEnd)){
    var e=document.getElementById('en-err');e.textContent='Enter fuel reading';e.classList.add('show');return;
  }
  var consumed=Math.max(0,fuelEnd-fuelStart);
  var time=document.getElementById('en-time').value;
  var actualFrom=document.getElementById('en-from').value.trim();
  var actualTo=document.getElementById('en-to').value.trim();
  var note=document.getElementById('en-note').value.trim();
  var imgEl=document.getElementById('en-img-prev');
  var img=imgEl&&imgEl.src&&imgEl.src.startsWith('data:')?imgEl.src:'';
  var btn=document.querySelector('#form-modal .btn-primary');
  if(btn){btn.textContent='Submitting...';btn.disabled=true;}
  await dbUpdate('trips',id,{
    status:STATUS.PENDING,
    fuel_end:fuelEnd,
    consumed:consumed,
    end_time:time,
    actual_from:actualFrom,
    actual_to:actualTo,
    amendment_note:note,
    fuel_end_img:img
  });
  closeModal('form-modal');
  showToast('Submitted for review','success');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

async function verifyTrip(id){
  await dbUpdate('trips',id,{status:STATUS.VERIFIED,admin_note:''});
  closeModal('detail-modal');
  showToast('Trip verified','success');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}

async function requestCorrection(id){
  var note=prompt('Correction note for captain:');
  if(note===null)return;
  await dbUpdate('trips',id,{status:STATUS.CORRECTION,admin_note:note});
  closeModal('detail-modal');
  showToast('Correction requested');
  if(typeof renderSchedule==='function')renderSchedule();
  if(typeof renderDashboard==='function')renderDashboard();
}
