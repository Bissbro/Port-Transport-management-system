const PINS={admin:'0000',captain:'1234'};
const BASE='/Port-Transport-management-system/';

function getSession(){return JSON.parse(localStorage.getItem('port_session')||'null');}
function setSession(role,name){localStorage.setItem('port_session',JSON.stringify({role,name,loggedIn:true}));}
function clearSession(){localStorage.removeItem('port_session');}

function requireAuth(allowedRoles){
  var s=getSession();
  if(!s||!s.loggedIn){window.location.href=BASE+'index.html';return null;}
  if(allowedRoles&&!allowedRoles.includes(s.role)){window.location.href=BASE+'dashboard.html';return null;}
  return s;
}

function load(key,def){try{var v=localStorage.getItem(key);return v?JSON.parse(v):def;}catch(e){return def;}}
function save(key,val){localStorage.setItem(key,JSON.stringify(val));}

function todayStr(){return new Date().toISOString().split('T')[0];}
function fmtDate(d){if(!d)return'';var p=d.split('-');return p[2]+'.'+p[1]+'.'+p[0].slice(-2);}
function fmtDateTime(){var n=new Date();return n.toLocaleDateString('en-GB')+' '+n.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}
function nowTime(){return new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});}
function nextId(arr){return arr.length?Math.max.apply(null,arr.map(function(x){return x.id||0;}))+1:1;}
function initials(name){return name?name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase():'?';}

function showToast(msg,type){
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;
  t.style.background=type==='error'?'#C53030':type==='success'?'#1B8C7D':'var(--navy)';
  t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},2500);
}

function setRoleBadge(role){
  document.querySelectorAll('.role-badge').forEach(function(el){
    el.textContent=role==='admin'?'Admin':'Captain';
  });
}

function logout(){clearSession();window.location.href=BASE+'index.html';}
function openModal(){document.getElementById('modal-overlay').classList.add('open');}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');}
function closeModalOutside(e){if(e.target===document.getElementById('modal-overlay'))closeModal();}

/* Trip status helpers */
var STATUS={
  SCHEDULED:'scheduled',
  IN_PROGRESS:'in_progress',
  PENDING:'pending_review',
  VERIFIED:'verified',
  CORRECTION:'correction_needed'
};

function statusBadge(s){
  var map={
    scheduled:'badge-pending',
    in_progress:'badge-inprog',
    pending_review:'badge-pending',
    verified:'badge-active',
    correction_needed:'badge-correction'
  };
  var labels={
    scheduled:'Scheduled',
    in_progress:'In progress',
    pending_review:'Pending review',
    verified:'Verified',
    correction_needed:'Correction needed'
  };
  return'<span class="badge '+(map[s]||'badge-pending')+'">'+(labels[s]||s)+'</span>';
}

/* Permission checks */
function canEditTrip(session,trip){
  if(!session)return false;
  if(session.role==='admin')return true;
  return trip.captain===session.name&&(trip.status===STATUS.SCHEDULED||trip.status===STATUS.CORRECTION);
}

function canStartTrip(session,trip){
  if(!session||session.role==='admin')return false;
  return trip.captain===session.name&&trip.status===STATUS.SCHEDULED;
}

function canEndTrip(session,trip){
  if(!session||session.role==='admin')return false;
  return trip.captain===session.name&&trip.status===STATUS.IN_PROGRESS;
}

/* Default data */
function initData(){
  if(!localStorage.getItem('port_vessels'))save('port_vessels',[
    {id:1,name:'Swell',status:'active',captain:'Jailam',regNo:'MV-001',capacity:12,fuelCapacity:300,notes:'Main transfer vessel',photo:''},
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

/* Trip card HTML */
function tripCardHTML(t,session,showActions){
  var canEdit=canEditTrip(session,t);
  var canStart=canStartTrip(session,t);
  var canEnd=canEndTrip(session,t);
  return'<div class="trip-card" onclick="viewTrip('+t.id+')" style="cursor:pointer">'
    +'<div class="tc-head">'
    +'<div class="vessel-name">'+t.vessel+'</div>'
    +'<div style="display:flex;gap:6px;align-items:center">'+statusBadge(t.status)+'<span class="pill pill-date">'+fmtDate(t.date)+'</span></div>'
    +'</div>'
    +'<div class="tc-route">'+(t.actual_route||t.route)+(t.purpose?' · '+t.purpose:'')+'</div>'
    +'<div class="tc-meta">'
    +'<span class="pill '+(t.type==='Host'?'pill-host':'pill-guest')+'">'+t.type+'</span>'
    +(t.consumed?'<span class="pill pill-fuel">'+t.consumed+'L</span>':'')
    +'<span class="pill pill-cap">'+t.captain+'</span>'
    +(t.departure?'<span class="pill pill-date"><i class="ti ti-clock" style="font-size:10px;margin-right:2px"></i>'+t.departure+'</span>':'')
    +(t.status===STATUS.CORRECTION?'<span class="pill" style="background:#FFF5F5;color:#C53030">⚠ Correction needed</span>':'')
    +'</div>'
    +(showActions&&(canStart||canEnd)?
      '<div style="display:flex;gap:8px;margin-top:10px" onclick="event.stopPropagation()">'
      +(canStart?'<button class="btn btn-teal btn-sm" onclick="startTrip('+t.id+')">Start trip</button>':'')
      +(canEnd?'<button class="btn btn-primary btn-sm" onclick="endTrip('+t.id+')">End trip</button>':'')
      +'</div>':'')
    +'</div>';
}
