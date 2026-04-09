const N8N_URL = 'https://n8n.kurumi.software';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NzNjOGUyZi1lODgzLTQ4ZTUtODIwZi1mNTdlMDU0OGY2ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2FjZjJkMDMtZWFlNC00OTUyLWIxYmYtNTRlZTE3NjQ3YzYzIiwiaWF0IjoxNzc1NzI5MjMyLCJleHAiOjE3NzgyOTkyMDB9.kmG6Wz8tMErpmMA7n-PTbjaQ3NEfxHSTcIP6vRE50cM';
const WF_ID = 'iHnbF3T4HFjEgzY4';

// Получим текущий workflow для восстановления
async function main() {
  const resp = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  const wf = await resp.json();
  console.log('Current workflow:', wf.name);
  console.log('Nodes:', wf.nodes?.length);
  console.log('Connections:', Object.keys(wf.connections || {}));
  
  // Посмотрю что сломалось
  const notifyNode = wf.nodes?.find(n => n.name === 'Notify Manager');
  if (notifyNode) {
    console.log('\nNotify Manager node:');
    console.log(JSON.stringify(notifyNode, null, 2));
  }
}

main().catch(console.error);
