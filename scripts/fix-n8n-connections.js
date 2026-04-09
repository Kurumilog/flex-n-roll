const N8N_URL = 'https://n8n.kurumi.software';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NzNjOGUyZi1lODgzLTQ4ZTUtODIwZi1mNTdlMDU0OGY2ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2FjZjJkMDMtZWFlNC00OTUyLWIxYmYtNTRlZTE3NjQ3YzYzIiwiaWF0IjoxNzc1NzI5MjMyLCJleHAiOjE3NzgyOTkyMDB9.kmG6Wz8tMErpmMA7n-PTbjaQ3NEfxHSTcIP6vRE50cM';
const WF_ID = 'iHnbF3T4HFjEgzY4';

async function main() {
  const resp = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  const wf = await resp.json();

  // Fix connections: Transfer Session → Notify Manager
  // IF Manager Found → Transfer Session должна стать → Notify Manager
  if (wf.connections['IF Manager Found']) {
    const trueBranch = wf.connections['IF Manager Found'].main?.[1]; // true branch
    if (trueBranch) {
      trueBranch.forEach(conn => {
        if (conn.node === 'Transfer Session') {
          conn.node = 'Notify Manager';
        }
      });
    }
  }

  // Также нужно удалить старый Transfer Session из connections key
  if (wf.connections['Transfer Session']) {
    wf.connections['Notify Manager'] = wf.connections['Transfer Session'];
    delete wf.connections['Transfer Session'];
  }

  // Save
  const cleanWf = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings };
  const saveResp = await fetch(`${N8N_URL}/api/v1/workflows/${WF_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanWf)
  });
  const result = await saveResp.json();
  console.log('✅ Connections fixed:', result.updatedAt || 'ok');
  console.log('IF Manager Found → Notify Manager → Create Task');
}

main().catch(console.error);
