const SUPABASE_URL='https://aawyyyhtfrkzjirqafeh.supabase.co';
const SUPABASE_ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFhd3l5eWh0ZnJremppcnFhZmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3ODQxNTAsImV4cCI6MjEwNDM2MDE1MH0.7A48ilqzbAn64TkeqV8a60rDmSTIpJ-M6xVbCFDJhxw';

async function dbGet(table,filters){
  var url=SUPABASE_URL+'/rest/v1/'+table+'?select=*&order=created_at.asc';
  if(filters)url+=filters;
  var r=await fetch(url,{headers:{'apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON}});
  return r.json();
}

async function dbInsert(table,data){
  var r=await fetch(SUPABASE_URL+'/rest/v1/'+table,{
    method:'POST',
    headers:{'apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON,'Content-Type':'application/json','Prefer':'return=representation'},
    body:JSON.stringify(data)
  });
  return r.json();
}

async function dbUpdate(table,id,data){
  var r=await fetch(SUPABASE_URL+'/rest/v1/'+table+'?id=eq.'+id,{
    method:'PATCH',
    headers:{'apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON,'Content-Type':'application/json','Prefer':'return=representation'},
    body:JSON.stringify(data)
  });
  return r.json();
}

async function dbDelete(table,id){
  var r=await fetch(SUPABASE_URL+'/rest/v1/'+table+'?id=eq.'+id,{
    method:'DELETE',
    headers:{'apikey':SUPABASE_ANON,'Authorization':'Bearer '+SUPABASE_ANON}
  });
  return r.ok;
}

async function dbSeed(){
  var vessels=await dbGet('vessels');
  if(vessels.length===0){
    await dbInsert('vessels',[
      {name:'Swell',status:'active',captain:'Jailam',reg_no:'MV-001',capacity:12,fuel_capacity:300,notes:''},
      {name:'Drift',status:'docked',captain:'Amdhah',reg_no:'MV-002',capacity:10,fuel_capacity:250,notes:''},
      {name:'Crest',status:'active',captain:'Rauf',reg_no:'MV-003',capacity:8,fuel_capacity:200,notes:''}
    ]);
  }
  var team=await dbGet('team');
  if(team.length===0){
    await dbInsert('team',[
      {name:'Jailam',title:'Captain',vessel:'Swell',phone:''},
      {name:'Amdhah',title:'Captain',vessel:'Drift',phone:''},
      {name:'Rauf',title:'Captain',vessel:'Crest',phone:''},
      {name:'Usaid',title:'Guest Relations',vessel:'',phone:''}
    ]);
  }
}
