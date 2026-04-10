/**
 * fix-n8n-routing-workflow.js
 *
 * Fixes the Routing workflow to properly handle Bitrix24 Open Lines webhooks:
 * 1. Extract Data — parse ONIMCONNECTORMESSAGEADD payload correctly
 * 2. NestJS Routing — proper body with expressions
 * 3. Notify Manager — im.message.add body
 * 4. Create Task — tasks.task.add body
 * 5. Auto Reply — im.message.add to client with autoReplyText
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
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          reject(new Error(`Invalid JSON: ${data.substring(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.setTimeout(15000);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('📥 Fetching Routing workflow...');
  const wf = (await n8nRequest('GET', `/api/v1/workflows/${WORKFLOW_ID}`)).body;
  console.log(`  Got ${wf.nodes.length} nodes\n`);

  // ── 1. Extract Data: fix parsing for ONIMCONNECTORMESSAGEADD ──
  const extractNode = wf.nodes.find((n) => n.name === 'Extract Data');
  extractNode.parameters.jsCode = [
    '// Parse Bitrix24 ONIMCONNECTORMESSAGEADD webhook',
    'const input = $input.first().json;',
    'const body = input.body || input;',
    'const data = body.data || body;',
    'const connector = data.CONNECTOR || {};',
    'const dialog = data.DIALOG || {};',
    'const user = data.USER || {};',
    'const message = (data.MESSAGES || [])[0] || {};',
    '',
    '// Determine channel from connector name',
    'const channelName = (connector.NAME || \'\').toLowerCase();',
    'const channel = channelName.includes(\'telegram\') ? \'telegram\'',
    '  : channelName.includes(\'whatsapp\') ? \'whatsapp\'',
    '  : channelName.includes(\'viber\') ? \'viber\'',
    '  : \'telegram\'; // default',
    '',
    'return [{',
    '  json: {',
    '    messageText: message.TEXT || message.text || data.TEXT || data.text || \'Нет текста\',',
    '    sessionId: dialog.ID || data.DIALOG_ID || \'\',',
    '    dialogId: dialog.ID || data.DIALOG_ID || \'\',',
    '    eventId: data.ID || data.event_id || `event-${Date.now()}`,',
    '    userId: user.ID || data.USER_ID || \'\',',
    '    channel: channel,',
    '    connectorName: connector.NAME || \'unknown\',',
    '    rawBody: body',
    '  }',
    '}];',
  ].join('\n');
  console.log('✅ Extract Data — parsing fixed for ONIMCONNECTORMESSAGEADD');

  // ── 2. NestJS Routing — fix body expressions ──
  const nestjsNode = wf.nodes.find((n) => n.name === 'NestJS Routing');
  nestjsNode.parameters.jsonBody = JSON.stringify({
    messageText: '={{ $json.messageText }}',
    channel: '={{ $json.channel }}',
    clientBitrixId: '={{ $json.sessionId }}',
    eventId: '={{ $json.eventId }}',
  }, null, 2);
  // Remove the leading = from the stringified JSON — n8n expects ={{...}}
  nestjsNode.parameters.jsonBody = `=${nestjsNode.parameters.jsonBody}`;
  console.log('✅ NestJS Routing — body expressions added');

  // ── 3. Notify Manager — im.message.add with proper body ──
  const notifyNode = wf.nodes.find((n) => n.name === 'Notify Manager');
  notifyNode.parameters.sendBody = true;
  notifyNode.parameters.contentType = 'application/json';
  notifyNode.parameters.specifyBody = 'json';
  notifyNode.parameters.jsonBody = [
    '={',
    '  "USER_ID": "={{ $json.data?.managerId || $json.managerId }}",',
    '  "MESSAGE": "={{ `📩 Новое сообщение от клиента\\n\\nТекст: ${$parent.node[\\"Extract Data\\"].json.messageText}\\nТема: ${$json.data?.topic || $json.topic}\\nСрочность: ${$json.data?.urgency || $json.urgency}\\nПричина: ${$json.data?.reason || $json.reason}` }}"',
    '}',
  ].join('\n');
  console.log('✅ Notify Manager — im.message.add body added');

  // ── 4. Create Task — tasks.task.add with proper body ──
  const taskNode = wf.nodes.find((n) => n.name === 'Create Task');
  taskNode.parameters.sendBody = true;
  taskNode.parameters.contentType = 'application/json';
  taskNode.parameters.specifyBody = 'json';
  taskNode.parameters.jsonBody = [
    '={',
    '  "fields": {',
    '    "TITLE": "={{ `Обработка обращения (${ $parent.node[\\"Extract Data\\"].json.channel })` }}",',
    '    "DESCRIPTION": "={{ `Клиент ID: ${$parent.node[\\"Extract Data\\"].json.userId}\\nТекст: ${$parent.node[\\"Extract Data\\"].json.messageText}\\nТема: ${$json.data?.topic || $json.topic}\\nСрочность: ${$json.data?.urgency || $json.urgency}` }}",',
    '    "RESPONSIBLE_ID": "={{ $json.data?.managerId || $json.managerId }}"',
    '  }',
    '}',
  ].join('\n');
  console.log('✅ Create Task — tasks.task.add body added');

  // ── 5. Auto Reply — im.message.add to client ──
  const autoReplyNode = wf.nodes.find((n) => n.name === 'Auto Reply');
  autoReplyNode.parameters.sendBody = true;
  autoReplyNode.parameters.contentType = 'application/json';
  autoReplyNode.parameters.specifyBody = 'json';
  autoReplyNode.parameters.jsonBody = [
    '={',
    '  "DIALOG_ID": "={{ $parent.node[\\"Extract Data\\"].json.dialogId }}",',
    '  "MESSAGE": "={{ $json.data?.autoReplyText || $json.autoReplyText || \'Все специалисты заняты. Мы ответим вам в ближайшее время.\' }}",',
    '  "SYSTEM": "Y"',
    '}',
  ].join('\n');
  console.log('✅ Auto Reply — im.message.add body added (client auto-reply)');

  // ── PUT update ──
  console.log('\n📤 Updating workflow...');
  await n8nRequest('POST', `/api/v1/workflows/${WORKFLOW_ID}/deactivate`);
  
  const putRes = await n8nRequest('PUT', `/api/v1/workflows/${WORKFLOW_ID}`, {
    name: wf.name,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: { executionOrder: 'v1' },
  });
  console.log(`  PUT status: ${putRes.status}`);

  await n8nRequest('POST', `/api/v1/workflows/${WORKFLOW_ID}/activate`);
  console.log('  ✅ Workflow reactivated\n');

  // ── Verify ──
  const updated = (await n8nRequest('GET', `/api/v1/workflows/${WORKFLOW_ID}`)).body;
  console.log('=== VERIFICATION ===');
  for (const node of updated.nodes) {
    if (['Extract Data', 'NestJS Routing', 'Notify Manager', 'Create Task', 'Auto Reply'].includes(node.name)) {
      const hasBody = node.parameters.jsonBody ? '✅' : '❌';
      console.log(`  ${node.name}: body=${hasBody}`);
      if (node.parameters.jsonBody) {
        console.log(`    body: ${node.parameters.jsonBody.substring(0, 100)}...`);
      }
    }
  }
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
