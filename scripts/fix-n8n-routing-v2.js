/**
 * fix-n8n-routing-v2.js
 *
 * Исправляет jsonBody формат — n8n требует одну строку-выражение "=...",
 * не JSON внутри JSON.
 */

const https = require('https');
const N8N_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NzNjOGUyZi1lODgzLTQ4ZTUtODIwZi1mNTdlMDU0OGY2ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2FjZjJkMDMtZWFlNC00OTUyLWIxYmYtNTRlZTE3NjQ3YzYzIiwiaWF0IjoxNzc1NzI5MjMyLCJleHAiOjE3NzgyOTkyMDB9.kmG6Wz8tMErpmMA7n-PTbjaQ3NEfxHSTcIP6vRE50cM';
const WORKFLOW_ID = 'iHnbF3T4HFjEgzY4';

function n8nRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'https://n8n.kurumi.software');
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json' },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { reject(new Error(`Invalid JSON: ${data.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('📥 Fetching workflow...');
  const wf = (await n8nRequest('GET', `/api/v1/workflows/${WORKFLOW_ID}`)).body;

  // ── 1. NestJS Routing ──
  // jsonBody = single expression string "=..."
  const nestjsNode = wf.nodes.find((n) => n.name === 'NestJS Routing');
  nestjsNode.parameters.jsonBody = '={ "messageText": "{{ $json.messageText }}", "channel": "{{ $json.channel }}", "clientBitrixId": "{{ $json.sessionId }}", "eventId": "{{ $json.eventId }}" }';
  console.log('✅ NestJS Routing body:', nestjsNode.parameters.jsonBody.substring(0, 120));

  // ── 2. Notify Manager ──
  const notifyNode = wf.nodes.find((n) => n.name === 'Notify Manager');
  notifyNode.parameters.jsonBody = '={ "USER_ID": "{{ $json.data.managerId || $json.managerId }}", "MESSAGE": "📩 Новое сообщение: {{ $parent.node[\"Extract Data\"].json.messageText }} | Тема: {{ $json.data.topic || $json.topic }} | Срочность: {{ $json.data.urgency || $json.urgency }}" }';
  console.log('✅ Notify Manager body:', notifyNode.parameters.jsonBody.substring(0, 120));

  // ── 3. Create Task ──
  const taskNode = wf.nodes.find((n) => n.name === 'Create Task');
  taskNode.parameters.jsonBody = '={ "fields": { "TITLE": "Обработка обращения ({{ $parent.node[\"Extract Data\"].json.channel }})", "DESCRIPTION": "Текст: {{ $parent.node[\"Extract Data\"].json.messageText }} | Тема: {{ $json.data.topic || $json.topic }}", "RESPONSIBLE_ID": "{{ $json.data.managerId || $json.managerId }}" } }';
  console.log('✅ Create Task body:', taskNode.parameters.jsonBody.substring(0, 120));

  // ── 4. Auto Reply ──
  const autoReplyNode = wf.nodes.find((n) => n.name === 'Auto Reply');
  autoReplyNode.parameters.jsonBody = '={ "DIALOG_ID": "{{ $parent.node[\"Extract Data\"].json.dialogId }}", "MESSAGE": "{{ $json.data.autoReplyText || $json.autoReplyText || \"Все специалисты заняты. Мы ответим вам в ближайшее время.\" }}", "SYSTEM": "Y" }';
  console.log('✅ Auto Reply body:', autoReplyNode.parameters.jsonBody.substring(0, 120));

  // ── PUT ──
  console.log('\n📤 Updating...');
  await n8nRequest('POST', `/api/v1/workflows/${WORKFLOW_ID}/deactivate`);

  const putRes = await n8nRequest('PUT', `/api/v1/workflows/${WORKFLOW_ID}`, {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: { executionOrder: 'v1' },
  });
  console.log(`PUT status: ${putRes.status}`);

  await n8nRequest('POST', `/api/v1/workflows/${WORKFLOW_ID}/activate`);
  console.log('✅ Reactivated');

  // Verify
  const updated = (await n8nRequest('GET', `/api/v1/workflows/${WORKFLOW_ID}`)).body;
  for (const node of updated.nodes) {
    if (['NestJS Routing', 'Notify Manager', 'Create Task', 'Auto Reply'].includes(node.name)) {
      console.log(`  ${node.name}: body length = ${(node.parameters.jsonBody || '').length}`);
    }
  }
}

main().catch((err) => { console.error('Fatal:', err.message); process.exit(1); });
