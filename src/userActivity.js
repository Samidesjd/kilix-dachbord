export async function loadUserActivity(supabase){
  if(!supabase)return {sessions:[],summary:[]};
  const usersResult=await supabase.from('users').select('auth_id,user_code,email,first_name,last_name');
  if(usersResult.error)throw usersResult.error;
  const sessionsResult=await supabase.from('user_sessions').select('user_id,started_at,ended_at,last_seen_at,duration_seconds').order('started_at',{ascending:false}).limit(5000);
  if(sessionsResult.error)throw sessionsResult.error;
  const users=new Map((usersResult.data||[]).map(u=>[u.auth_id,u]));
  const sessions=(sessionsResult.data||[]).map(s=>{
    const end=s.ended_at?new Date(s.ended_at).getTime():new Date(s.last_seen_at).getTime();
    const duration=s.duration_seconds!=null?s.duration_seconds:Math.max(0,Math.floor((end-new Date(s.started_at).getTime())/1000));
    return {...s,user:users.get(s.user_id)||{},duration_seconds:duration};
  });
  const grouped=new Map();
  sessions.forEach(s=>{
    const item=grouped.get(s.user_id)||{user_id:s.user_id,user:s.user,logins:0,total_seconds:0,last_login:null};
    item.logins+=1; item.total_seconds+=s.duration_seconds||0;
    if(!item.last_login||new Date(s.started_at)>new Date(item.last_login))item.last_login=s.started_at;
    grouped.set(s.user_id,item);
  });
  return {sessions,summary:[...grouped.values()].sort((a,b)=>b.logins-a.logins)};
}
export function formatDuration(seconds){
  const s=Math.max(0,Math.round(seconds||0)),h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;
  return h?h+'س '+m+'د':m?m+'د '+r+'ث':r+'ث';
}