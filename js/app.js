const PINS={admin:'0000',captain:'1234'};

function getSession(){return JSON.parse(localStorage.getItem('port_session')||'null');}
function setSession(role){localStorage.setItem('port_session',JSON.stringify({role,loggedIn:true}));}
function clearSession(){localStorage.removeItem('port_session');}

function requireAuth(allowedRoles){
  var s=getSession();
  if(!s||!s.loggedIn){window.location.href='/Port-Transport-management-system/index.html';return null;}
  if(allowedRoles&&!allowedRoles.includes(s.role)){window.location.href='/Port-Transport-management-system/dashboard.html';return null;}
  return s;
}

function load(key,def){try{return JSON.parse(localStorage.getItem(key))||def;}catch(e){return def;}}
function save(key,val){localStorage.setItem(key,JSON.stringify(val));}

function todayStr(){return new Date().toISOString().split('T')[0];}
function fmtDate(d){if(!d)return'';var p=d.split('-');return p[2]+'.'+p[1]+'.'+p[0].slice(-2);}
function fmtDateTime(){var n=new Date();return n.toLocaleDateString()+' '+n.toLocaleTimeString();}
function nextId(arr){return arr.length?Math.max.apply(null,arr.map(function(x){return x.id||0;}))+1:1;}
function initials(name){return name?name.split(' ').map(function(w){return w[0];}).join('').slice(0,2).toUpperCase():'?';}

function showToast(msg){
  var t=document.getElementById('toast');
  if(!t)return;
  t.textContent=msg;t.classList.add('show');
  setTimeout(function(){t.classList.remove('show');},2500);
}

function setRoleBadges(role){
  document.querySelectorAll('.role-badge').forEach(function(el){
    el.textContent=role==='admin'?'Admin':'Captain';
  });
}

function logout(){
  clearSession();
  window.location.href='/Port-Transport-management-system/index.html';
}

function openModal(){document.getElementById('modal-overlay').classList.add('open');}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');}
function closeModalOutside(e){if(e.target===document.getElementById('modal-overlay'))closeModal();}

var defaultVessels=[
  {id:1,name:'Swell',status:'active',captain:'Jailam',regNo:'MV-001',capacity:12,fuelCapacity:300,notes:'Main transfer vessel',photo:''},
  {id:2,name:'Drift',status:'docked',captain:'Amdhah',regNo:'MV-002',capacity:10,fuelCapacity:250,notes:'',photo:''},
  {id:3,name:'Crest',status:'active',captain:'Rauf',regNo:'MV-003',capacity:8,fuelCapacity:200,notes:'',photo:''}
];
var defaultTeam=[
  {id:1,name:'Jailam',title:'Captain',vessel:'Swell',phone:''},
  {id:2,name:'Amdhah',title:'Captain',vessel:'Drift',phone:''},
  {id:3,name:'Rauf',title:'Captain',vessel:'Crest',phone:''},
  {id:4,name:'Usaid',title:'Guest Relations',vessel:'',phone:''}
];
var defaultTrips=[
  {id:1,date:'2026-09-05',vessel:'Swell',captain:'Jailam',crew:'',type:'Guest',route:'Sea Plane',purpose:'Departure',fuelStart:120,fuelEnd:140,consumed:20,startTime:'08:00',endTime:'09:15',fuelStartImg:'',fuelEndImg:''},
  {id:2,date:'2026-09-06',vessel:'Swell',captain:'Amdhah',crew:'',type:'Host',route:'Raafushi',purpose:'Private Snorkeling',fuelStart:101,fuelEnd:175,consumed:74,startTime:'10:00',endTime:'12:30',fuelStartImg:'',fuelEndImg:''}
];

function initData(){
  if(!localStorage.getItem('port_vessels'))save('port_vessels',defaultVessels);
  if(!localStorage.getItem('port_team'))save('port_team',defaultTeam);
  if(!localStorage.getItem('port_trips'))save('port_trips',defaultTrips);
  if(!localStorage.getItem('port_checklists'))save('port_checklists',[]);
  if(!localStorage.getItem('port_schedule'))save('port_schedule',[]);
}
