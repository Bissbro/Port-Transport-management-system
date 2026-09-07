const SUPABASE_URL='https://aawyyyhtfrkzjirqafeh.supabase.co';
const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhd3l5eWh0ZnJremppcnFhZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODQxNTAsImV4cCI6MjEwNDM2MDE1MH0.7A48ilqzbAn64TkeqV8a60rDmSTIpJ-M6xVbCFDJhxw';

var SB_HEADERS={
  'apikey':SUPABASE_ANON,
  'Authorization':'Bearer '+SUPABASE_ANON,
  'Content-Type':'application/json',
  'Accept':'application/json'
};

async function dbGet(table,filter){
  try{
    var url=SUPABASE_URL+'/rest/v1/'+table+'?select=*';
    if(filter)url+=filter;
    console.log('dbGet',url);
    var r=await fetch(url,{method:'GET',headers:SB_HEADERS});
    var text=await r.text();
    console.log('dbGet response',r.status,text.slice(0,200));
    if(!r.ok){
      var t=document.getElementById('toast');
      if(t){t.textContent='DB error: '+r.status+' '+text.slice(0,50);t.style.background='#C53030';t.classList.add('show');setTimeout(function(){t.classList.remove('show');},5000);}
      return[];
    }
    return JSON.parse(text);
  }catch(e){
    console.error('dbGet exception',e);
    var t=document.getElementById('toast');
    if(t){t.textContent='Network error: '+e.message;t.style.background='#C53030';t.classList.add('show');setTimeout(function(){t.classList.remove('show');},5000);}
    return[];
  }
}

async function dbInsert(table,data){
  try{
    console.log('dbInsert',table,data);
    var r=await fetch(SUPABASE_URL+'/rest/v1/'+table,{
      method:'POST',
      headers:Object.assign({},SB_HEADERS,{'Prefer':'return=representation'}),
      body:JSON.stringify(data)
    });
    var text=await r.text();
    console.log('dbInsert response',r.status,text.slice(0,200));
    if(!r.ok){
      var t=document.getElementById('toast');
      if(t){t.textContent='Insert error: '+r.status;t.style.background='#C53030';t.classList.add('show');setTimeout(function(){t.classList.remove('show');},5000);}
      return null;
    }
    return JSON.parse(text);
  }catch(e){console.error('dbInsert exception',e);return null;}
}

async function dbUpdate(table,id,data){
  try{
    var r=await fetch(SUPABASE_URL+'/rest/v1/'+table+'?id=eq.'+id,{
      method:'PATCH',
      headers:Object.assign({},SB_HEADERS,{'Prefer':'return=representation'}),
      body:JSON.stringify(data)
    });
    var text=await r.text();
    console.log('dbUpdate response',r.status,text.slice(0,200));
    if(!r.ok){return null;}
    return JSON.parse(text);
  }catch(e){console.error('dbUpdate exception',e);return null;}
}

async function dbDelete(table,id){
  try{
    var r=await fetch(SUPABASE_URL+'/rest/v1/'+table+'?id=eq.'+id,{
      method:'DELETE',
      headers:SB_HEADERS
    });
    return r.ok;
  }catch(e){console.error('dbDelete exception',e);return false;}
}

async function dbSeed(){
  try{
    var vessels=await dbGet('vessels');
    if(!vessels||vessels.length===0){
      await dbInsert('vessels',[
        {name:'Swell',status:'active',captain:'Jailam',reg_no:'MV-001',capacity:12,fuel_capacity:300,notes:'',photo:''},
        {name:'Drift',status:'docked',captain:'Amdhah',reg_no:'MV-002',capacity:10,fuel_capacity:250,notes:'',photo:''},
        {name:'Crest',status:'active',captain:'Rauf',reg_no:'MV-003',capacity:8,fuel_capacity:200,notes:'',photo:''}
      ]);
    }
    var team=await dbGet('team');
    if(!team||team.length===0){
      await dbInsert('team',[
        {name:'Jailam',title:'Captain',vessel:'Swell',phone:''},
        {name:'Amdhah',title:'Captain',vessel:'Drift',phone:''},
        {name:'Rauf',title:'Captain',vessel:'Crest',phone:''},
        {name:'Usaid',title:'Guest Relations',vessel:'',phone:''}
      ]);
    }
  }catch(e){console.error('dbSeed error',e);}
}
