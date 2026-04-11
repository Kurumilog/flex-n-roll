/**
 * update-n8n-bitrix-oauth.js
 *
 * Заменяет Bitrix24 webhook URL (rest/1/YOUR_WEBHOOK_CODE/method)
 * на OAuth URL (rest/method?auth=ACCESS_TOKEN) во всех HTTP Request нодах.
 *
 * Usage: node scripts/update-n8n-bitrix-oauth.js
 *
 * Токены берутся из docs/n8n-api-reference.md (захардкожены для скрипта).
 */

const https = require('https');

// === CONFIG ===
const N8N_BASE_URL = 'https://n8n.kurumi.software';
const N8N_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NzNjOGUyZi1lODgzLTQ4ZTUtODIwZi1mNTdlMDU0OGY2ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2FjZjJkMDMtZWFlNC00OTUyLWIxYmYtNTRlZTE3NjQ3YzYzIiwiaWF0IjoxNzc1NzI5MjMyLCJleHAiOjE3NzgyOTkyMDB9.kmG6Wz8tMErpmMA7n-PTbjaQ3NEfxHSTcIP6vRE50cM';

const BITRIX24_PORTAL = 'https://YOUR-PORTAL.bitrix24.ru';
const BITRIX24_ACCESS_TOKEN =
  'YOUR_ACCESS_TOKEN';

// Webhook path to remove: /rest/1/YOUR_WEBHOOK_CODE/
const WEBHOOK_PATH_REGEX = /\/rest\/1\/[A-Za-z0-9]+\//g;

// Workflows to update: [workflowId, [nodeNames]]
const WORKFLOWS_TO_UPDATE = [
  {
    id: 'iHnbF3T4HFjEgzY4',
    name: 'FlexRouter — Routing',
    nodes: ['Notify Manager', 'Create Task', 'Auto Reply'],
  },
  {
    id: 'cTp3tAVjyWmqHY2i',
    name: 'My workflow',
    nodes: ['HTTP Request', 'HTTP Request1'],
  },
  {
    id: 'Esa9RuyUEMchzlf0',
    name: 'FlexRouter — Transfer Inactive',
    nodes: ['Get Open Sessions'],
  },
];

// === HELPERS ===

function n8nRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, N8N_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Invalid JSON response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.setTimeout(15000);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function transformUrl(oldUrl) {
  // oldUrl: =https://YOUR-PORTAL.bitrix24.ru/rest/1/YOUR_WEBHOOK_CODE/im.message.add
  // or:     https://YOUR-PORTAL.bitrix24.ru/rest/1/YOUR_WEBHOOK_CODE/crm.lead.get
  // newUrl: =https://YOUR-PORTAL.bitrix24.ru/rest/im.message.add?auth=TOKEN

  const isExpression = oldUrl.startsWith('=');
  let url = isExpression ? oldUrl.substring(1) : oldUrl;

  // Extract method name from the end of the URL
  const methodMatch = url.match(/\/([a-zA-Z0-9_.]+)$/);
  if (!methodMatch) {
    throw new Error(`Cannot extract method name from URL: ${url}`);
  }
  const methodName = methodMatch[1];

  // Build new URL with OAuth auth parameter
  const newUrl = `${BITRIX24_PORTAL}/rest/${methodName}?auth=${BITRIX24_ACCESS_TOKEN}`;

  return isExpression ? `=${newUrl}` : newUrl;
}

async function getWorkflow(id) {
  return n8nRequest('GET', `/api/v1/workflows/${id}`);
}

async function deactivateWorkflow(id) {
  return n8nRequest('POST', `/api/v1/workflows/${id}/deactivate`);
}

async function activateWorkflow(id) {
  return n8nRequest('POST', `/api/v1/workflows/${id}/activate`);
}

async function updateWorkflow(id, workflow) {
  // n8n PUT /workflows/{id} accepts ONLY these fields:
  // - name (required)
  // - nodes (required)
  // - connections (required)
  // - settings (optional, but schema is strict: only executionOrder allowed)
  // All other fields (meta, pinData, versionId, shared, etc.) cause 400 error.
  const { name, nodes, connections } = workflow;
  return n8nRequest('PUT', `/api/v1/workflows/${id}`, {
    name,
    nodes,
    connections,
    settings: { executionOrder: 'v1' },
  });
}

function updateNodesInWorkflow(workflow, nodeNames) {
  let updatedCount = 0;
  const changes = [];

  for (const node of workflow.nodes) {
    if (!nodeNames.includes(node.name)) continue;
    if (node.type !== 'n8n-nodes-base.httpRequest') {
      console.warn(
        `⚠️  Node "${node.name}" is not an HTTP Request node (type: ${node.type}), skipping`
      );
      continue;
    }

    const oldUrl = node.parameters.url;
    if (!oldUrl) {
      console.warn(`⚠️  Node "${node.name}" has no URL parameter, skipping`);
      continue;
    }

    if (!oldUrl.includes('YOUR-PORTAL.bitrix24.ru')) {
      console.warn(
        `⚠️  Node "${node.name}" URL doesn't contain YOUR-PORTAL, skipping: ${oldUrl}`
      );
      continue;
    }

    const newUrl = transformUrl(oldUrl);
    node.parameters.url = newUrl;

    // Also ensure sendBody and contentType are set for POST requests
    if (node.parameters.method === 'POST' && !node.parameters.sendBody) {
      node.parameters.sendBody = true;
      node.parameters.contentType = 'application/json';
    }

    changes.push({
      node: node.name,
      oldUrl: oldUrl.substring(0, 80),
      newUrl: newUrl.substring(0, 80) + '...',
    });
    updatedCount++;
  }

  return { updatedCount, changes };
}

// === MAIN ===

async function main() {
  console.log('🔄 Updating Bitrix24 webhook URLs → OAuth in n8n workflows\n');
  console.log(`Portal: ${BITRIX24_PORTAL}`);
  console.log(`Access token: ${BITRIX24_ACCESS_TOKEN.substring(0, 20)}...`);
  console.log(`Workflows to update: ${WORKFLOWS_TO_UPDATE.length}\n`);

  let totalUpdated = 0;

  for (const wf of WORKFLOWS_TO_UPDATE) {
    console.log(`📋 Workflow: ${wf.name} (${wf.id})`);
    console.log(`   Nodes to update: ${wf.nodes.join(', ')}`);

    try {
      // Fetch current workflow
      const workflow = await getWorkflow(wf.id);
      const wasActive = workflow.active;
      console.log(`   ✅ Fetched (${workflow.nodes?.length || 0} nodes, active: ${wasActive})`);

      // Update nodes in memory
      const result = updateNodesInWorkflow(workflow, wf.nodes);

      if (result.updatedCount === 0) {
        console.log(`   ⏭️  No nodes needed updating\n`);
        continue;
      }

      // Show changes
      for (const change of result.changes) {
        console.log(`   ✏️  ${change.node}`);
        console.log(`      OLD: ${change.oldUrl}`);
        console.log(`      NEW: ${change.newUrl}`);
      }

      // Deactivate if active (n8n may reject PUT on active workflows)
      if (wasActive) {
        console.log(`   ⏸️  Deactivating workflow...`);
        await deactivateWorkflow(wf.id);
        console.log(`   ✅ Deactivated`);
      }

      // PUT update
      console.log(`   📤 Updating workflow...`);
      await updateWorkflow(wf.id, workflow);
      console.log(`   ✅ Workflow updated`);

      // Reactivate if it was active
      if (wasActive) {
        console.log(`   ▶️  Reactivating workflow...`);
        await activateWorkflow(wf.id);
        console.log(`   ✅ Reactivated`);
      }

      console.log(`   🎉 Updated ${result.updatedCount} node(s)\n`);

      totalUpdated += result.updatedCount;
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}\n`);
    }
  }

  console.log(`\n🎉 Done! Total nodes updated: ${totalUpdated}`);
  console.log('\nNext steps:');
  console.log('1. Verify workflows in n8n UI');
  console.log('2. Test a routing flow through Bitrix24');
  console.log('3. Update TODO.md to mark task 1 as complete');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
