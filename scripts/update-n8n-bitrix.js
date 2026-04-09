const WORKFLOW_ID = 'iHnbF3T4HFjEgzY4';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NzNjOGUyZi1lODgzLTQ4ZTUtODIwZi1mNTdlMDU0OGY2ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2FjZjJkMDMtZWFlNC00OTUyLWIxYmYtNTRlZTE3NjQ3YzYzIiwiaWF0IjoxNzc1NzI5MjMyLCJleHAiOjE3NzgyOTkyMDB9.kmG6Wz8tMErpmMA7n-PTbjaQ3NEfxHSTcIP6vRE50cM';
const N8N_URL = 'https://n8n.kurumi.software';

async function main() {
  const resp = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
    headers: { 'X-N8N-API-KEY': API_KEY }
  });
  const wf = await resp.json();

  // Find Transfer Session node
  const transferNode = wf.nodes.find(n => n.name === 'Transfer Session');
  if (!transferNode) {
    console.log('Transfer Session node not found — already updated?');
    return;
  }

  // Replace with Notify Manager
  transferNode.name = 'Notify Manager';
  transferNode.id = 'e9a8c3f2-1d45-4b89-a3c7-f8e2d9b1a4c6';
  transferNode.type = 'n8n-nodes-base.httpRequest';
  transferNode.typeVersion = 4.4;
  transferNode.parameters = {
    method: 'POST',
    url: '=https://b24-p0ujtw.bitrix24.ru/rest/1/9591mae2cb8qecvt/im.message.add',
    sendBody: true,
    contentType: 'application/json',
    specifyBody: 'json',
    jsonBody: `={
  "USER_ID": {{ $json.data?.managerId ?? $json.managerId }},
  "MESSAGE": "🔔 Новое обращение от клиента\\n\\nКанал: {{ $('Extract Data').first().json.channel }}\\nТема: {{ $json.data?.topic ?? $json.topic }}\\nСрочность: {{ $json.data?.urgency ?? $json.urgency }}\\n\\nСообщение:\\n{{ $('Extract Data').first().json.messageText }}\\n\\nПричина: {{ $json.data?.reason ?? $json.reason }}"
}`,
    options: { onError: 'continueRegularOutput' }
  };

  // Save
  const cleanWf = { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings: wf.settings };
  const saveResp = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(cleanWf)
  });
  const result = await saveResp.json();
  console.log('✅ Workflow updated:', result.updatedAt || 'ok');
  console.log('Node renamed: Transfer Session → Notify Manager');
  console.log('Method: imopenlines.session.transfer → im.message.add (USER_ID)');
}

main().catch(console.error);
