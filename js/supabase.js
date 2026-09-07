const SUPABASE_URL='https://aawyyyhtfrkzjirqafeh.supabase.co';
const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhd3l5eWh0ZnJremppcnFhZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODQxNTAsImV4cCI6MjEwNDM2MDE1MH0.7A48ilqzbAn64TkeqV8a60rDmSTIpJ-M6xVbCFDJhxw';

var SB_HEADERS={
  'apikey':SUPABASE_ANON,
  'Authorization':'Bearer '+SUPABASE_ANON,
  'Content-Type':'application/json'
};

async function dbGet(table,filter){
  try{
    var url=SUPABASE_URL+'/rest/v1/'+table+'?select=*';
    if(filter)url+=filter;
    var r=await fetch(url,{headers:SB_HEADERS});
    if(!r.ok){console.error('dbGet error',r.status,await r.text());return[];}
    return await r.json();
  }catch(e){console.error('dbGet exception',e);return[];}
}

async function dbInsert(table,data){
  try{
    var r=await fetch(SUPABASE_URL+'/rest/v1/'+table,{
      method:'POST',
      headers:Object.assign({},SB_HEADERS,{'Prefer':'return=representation'}),
      body:JSON.stringify(data)
    });
    if(!r.ok){console.error('dbInsert error',r.status,await r.text());return null;}
    return await r.json();
  }catch(e){console.error('dbInsert exception',e);return null;}
}

async function dbUpdate(table,id,data){
  try{
    var r=await fetch(SUPABASE_URL+'/rest/v1/'+table+'?id=eq.'+id,{
      method:'PATCH',
      headers:Object.assign({},SB_HEADERS,{'Prefer':'return=representation'}),
      body:JSON.stringify(data)
    });
    if(!r.ok){console.error('dbUpdate error',r.status,await r.text());return null;}
    return await r.json();
  }catch(e){console.error('dbUpdate exception',e);return null;}
}

async function dbDelete(table,id){
  try{
    var r=await fetch(SUPABASE_URL+'/rest/v1/'+table+'?id=eq.'+id,{
      method:'DELETE',
      headers:SB_HEADERS
    });
    if(!r.ok){console.error('dbDelete error',r.status,await r.text());return false;}
    return true;
  }catch(e){console.error('dbDelete exception',e);return false;}
}

async function dbSeed(){
  try{
    var vessels=await dbGet('vessels');
    if(!vessels||vessels.length===0){
      await dbInsert('vessels',[
        {name:'Swell',status:'active',captain:'Jailam',reg_no:'MV-001',capacity:12,fuel_capacity:300,notes:''},
        {name:'Drift',status:'docked',captain:'Amdhah',reg_no:'MV-002',capacity:10,fuel_capacity:250,notes:''},
        {name:'Crest',status:'active',captain:'Rauf',reg_no:'MV-003',capacity:8,fuel_capacity:200,notes:''}
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
