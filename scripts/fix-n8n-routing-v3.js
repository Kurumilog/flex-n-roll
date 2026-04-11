/**
 * fix-n8n-routing-v3.js
 * 
 * Упрощает Extract Data до минимума. Предыдущая версия использовала
 * data.MESSAGES[0].TEXT — но Bitrix24 может шлить данные в другом формате.
 * Также упрощаем NestJS Routing body.
 */

const https = require('https');
const N8N_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NzNjOGUyZi1lODgzLTQ4ZTUtODIwZi1mNTdlMDU0OGY2ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2FjZjJkMDMtZWFlNC00OTUyLWIxYmYtNTRlZTE3NjQ3YzYzIiwiaWF0IjoxNzc1NzI5MjMyLCJleHAiOjE3NzgyOTkyMDB9.kmG6Wz8tMErpmMA7n-PTbjaQ3NEfxHSTcIP6vRE50cM';
const WORKFLOW_ID = 'iHnbF3T4HFjEgzY4';

function n8nRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, 'https://n8n.kurumi.software');
    const opts = {
      hostname: url.hostname, port: 443,
      path: url.pathname + url.search, method,
      headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Content-Type': 'application/json' },
    };
    const req = https.request(opts, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { reject(new Error(d.substring(0, 200))); }
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

  // ── 1. Extract Data — максимально простой ──
  const extractNode = wf.nodes.find(n => n.name === 'Extract Data');
  extractNode.parameters.jsCode = [
    'const body = $input.first().json;',
    '',
    'bitrixData = body.data || body;',
    'connector = bitrixData.CONNECTOR || {};',
    'dialog = bitrixData.DIALOG || {};',
    'user = bitrixData.USER || {};',
    'messages = bitrixData.MESSAGES || [];',
    'message = messages[0] || {};',
    '',
    'channelName = (connector.NAME || "").toLowerCase();',
    'if (channelName.includes("whatsapp")) channel = "whatsapp";',
    'else if (channelName.includes("viber")) channel = "viber";',
    'else channel = "telegram";',
    '',
    'return [{',
    '  json: {',
    '    messageText: message.TEXT || message.text || bitrixData.TEXT || bitrixData.text || "Нет текста",',
    '    sessionId: dialog.ID || bitrixData.DIALOG_ID || "",',
    '    dialogId: dialog.ID || bitrixData.DIALOG_ID || "",',
    '    eventId: bitrixData.ID || ("evt-" + Date.now()),',
    '    userId: user.ID || bitrixData.USER_ID || "",',
    '    channel: channel,',
    '  }',
    '}];',
  ].join('\n');
  console.log('✅ Extract Data — simplified');

  // ── 2. NestJS Routing — URL через Tailscale (n8n MacBook → NestJS CachyOS) ──
  const nestjsNode = wf.nodes.find(n => n.name === 'NestJS Routing');
  // n8n on MacBook (YOUR_TAILSCALE_IP) → NestJS on CachyOS (YOUR_TAILSCALE_IP:3001)
  nestjsNode.parameters.url = 'http://YOUR_TAILSCALE_IP:3001/api/routing/route';
  nestjsNode.parameters.jsonBody = '={ "messageText": "{{ $json.messageText }}", "channel": "{{ $json.channel }}", "clientBitrixId": "{{ $json.sessionId }}", "eventId": "{{ $json.eventId }}" }';
  console.log('✅ NestJS Routing → Tailscale URL:', nestjsNode.parameters.url);

  // ── 3. Notify Manager ──
  const notifyNode = wf.nodes.find(n => n.name === 'Notify Manager');
  notifyNode.parameters.jsonBody = '={ "USER_ID": "{{ $json.data.managerId || $json.managerId }}", "MESSAGE": "📩 Новое: {{ $parent.node[\"Extract Data\"].json.messageText }} | Тема: {{ $json.data.topic || $json.topic }}" }';
  console.log('✅ Notify Manager body set');

  // ── 4. Create Task ──
  const taskNode = wf.nodes.find(n => n.name === 'Create Task');
  taskNode.parameters.jsonBody = '={ "fields": { "TITLE": "Обработка ({{ $parent.node[\"Extract Data\"].json.channel }})", "RESPONSIBLE_ID": "{{ $json.data.managerId || $json.managerId }}" } }';
  console.log('✅ Create Task body set');

  // ── 5. Auto Reply ──
  const autoReplyNode = wf.nodes.find(n => n.name === 'Auto Reply');
  autoReplyNode.parameters.jsonBody = '={ "DIALOG_ID": "{{ $parent.node[\"Extract Data\"].json.dialogId }}", "MESSAGE": "{{ $json.data.autoReplyText || $json.autoReplyText || \"Спасибо, мы скоро ответим.\" }}", "SYSTEM": "Y" }';
  console.log('✅ Auto Reply body set');

  // ── PUT ──
  console.log('\n📤 Updating...');
  await n8nRequest('POST', `/api/v1/workflows/${WORKFLOW_ID}/deactivate`);
  const putRes = await n8nRequest('PUT', `/api/v1/workflows/${WORKFLOW_ID}`, {
    name: wf.name, nodes: wf.nodes, connections: wf.connections,
    settings: { executionOrder: 'v1' },
  });
  console.log(`PUT: ${putRes.status}`);
  await n8nRequest('POST', `/api/v1/workflows/${WORKFLOW_ID}/activate`);
  console.log('✅ Reactivated');
}

main().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
