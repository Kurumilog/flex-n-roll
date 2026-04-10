/**
 * update-n8n-bitrix-oauth-credential.js
 *
 * Обновляет 6 Bitrix24 HTTP Request нод чтобы использовали OAuth2 credential
 * вместо статического access_token в URL.
 *
 * Что делает:
 * 1. Убирает ?auth=TOKEN из URL
 * 2. Добавляет authentication: genericCredentialType + genericAuthType: oAuth2Api
 * 3. Привязывает credential 7NqOd5ODFj6VHx2O
 *
 * Usage: node scripts/update-n8n-bitrix-oauth-credential.js
 */

const https = require('https');

// === CONFIG ===
const N8N_BASE_URL = 'https://n8n.kurumi.software';
const N8N_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3NzNjOGUyZi1lODgzLTQ4ZTUtODIwZi1mNTdlMDU0OGY2ZWMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiM2FjZjJkMDMtZWFlNC00OTUyLWIxYmYtNTRlZTE3NjQ3YzYzIiwiaWF0IjoxNzc1NzI5MjMyLCJleHAiOjE3NzgyOTkyMDB9.kmG6Wz8tMErpmMA7n-PTbjaQ3NEfxHSTcIP6vRE50cM';

const CREDENTIAL_ID = '7NqOd5ODFj6VHx2O';
const CREDENTIAL_NAME = 'Bitrix24 OAuth (hackathon-team-xx)';
const BITRIX24_PORTAL = 'https://b24-p0ujtw.bitrix24.ru';

// Workflows and nodes to update
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
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          reject(new Error(`Invalid JSON: ${data.substring(0, 200)}`));
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

function cleanUrl(oldUrl) {
  // =https://b24-p0ujtw.bitrix24.ru/rest/im.message.add?auth=TOKEN
  // → =https://b24-p0ujtw.bitrix24.ru/rest/im.message.add
  const isExpression = oldUrl.startsWith('=');
  let url = isExpression ? oldUrl.substring(1) : oldUrl;

  // Remove ?auth= parameter
  const cleanUrl = url.split('?')[0];

  return isExpression ? `=${cleanUrl}` : cleanUrl;
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

    if (!oldUrl.includes('b24-p0ujtw.bitrix24.ru')) {
      console.warn(
        `⚠️  Node "${node.name}" URL doesn't contain b24-p0ujtw, skipping: ${oldUrl}`
      );
      continue;
    }

    // Clean URL (remove ?auth=TOKEN)
    const newUrl = cleanUrl(oldUrl);

    // Update parameters to use OAuth2 credential
    node.parameters.authentication = 'genericCredentialType';
    node.parameters.genericAuthType = 'oAuth2Api';
    node.parameters.url = newUrl;

    // Add credential reference at node level
    node.credentials = {
      oAuth2Api: {
        id: CREDENTIAL_ID,
        name: CREDENTIAL_NAME,
      },
    };

    changes.push({
      node: node.name,
      oldUrl: oldUrl.substring(0, 90),
      newUrl: newUrl.substring(0, 80),
    });
    updatedCount++;
  }

  return { updatedCount, changes };
}

// === MAIN ===

async function main() {
  console.log('🔄 Updating Bitrix24 nodes to use OAuth2 credential\n');
  console.log(`Credential: ${CREDENTIAL_NAME} (${CREDENTIAL_ID})`);
  console.log(`Workflows to update: ${WORKFLOWS_TO_UPDATE.length}\n`);

  let totalUpdated = 0;

  for (const wf of WORKFLOWS_TO_UPDATE) {
    console.log(`📋 Workflow: ${wf.name} (${wf.id})`);
    console.log(`   Nodes to update: ${wf.nodes.join(', ')}`);

    try {
      const workflow = await getWorkflow(wf.id);
      const wasActive = workflow.body.active;
      console.log(`   ✅ Fetched (${workflow.body.nodes?.length || 0} nodes, active: ${wasActive})`);

      const result = updateNodesInWorkflow(workflow.body, wf.nodes);

      if (result.updatedCount === 0) {
        console.log(`   ⏭️  No nodes needed updating\n`);
        continue;
      }

      for (const change of result.changes) {
        console.log(`   ✏️  ${change.node}`);
        console.log(`      OLD: ${change.oldUrl}`);
        console.log(`      NEW: ${change.newUrl} (via credential)`);
      }

      // Deactivate if active
      if (wasActive) {
        console.log(`   ⏸️  Deactivating...`);
        await deactivateWorkflow(wf.id);
      }

      // PUT update
      console.log(`   📤 Updating...`);
      const putRes = await updateWorkflow(wf.id, workflow.body);
      console.log(`   ✅ Updated (${putRes.status})`);

      // Reactivate
      if (wasActive) {
        console.log(`   ▶️  Reactivating...`);
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
  console.log('\nNext: Verify auto-refresh works when access_token expires');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
