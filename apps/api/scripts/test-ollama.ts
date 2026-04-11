/**
 * Тест OllamaService напрямую
 */
import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://YOUR_TAILSCALE_IP:11434';
const OLLAMA_MODEL = process.env.OLLAMA_ROUTING_MODEL || 'qwen2.5:14b';

async function testOllama() {
  console.log(`Testing Ollama at ${OLLAMA_BASE_URL} with model ${OLLAMA_MODEL}`);
  
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: 'Ты система маршрутизации. Ответь JSON.' },
        { role: 'user', content: 'Нужна этикетка 58х40мм тираж 50000, срочно!\n\nДоступные менеджеры:\n[\n  {\n    "id": 33,\n    "name": "Александр Киппель",\n    "kpiScore": 68,\n    "department": "Чистая этикетка",\n    "position": "Менеджер по продажам"\n  }\n]\n\nВерни ТОЛЬКО валидный JSON:\n{\n  "manager_id": <number>,\n  "topic": "<price_negotiation|technical_specs|delivery|complaint|new_client|urgent_reorder|other>",\n  "urgency": "<low|medium|high>",\n  "reason": "<1-2 предложения>"\n}' }
      ],
      stream: false,
      options: {
        temperature: 0.1,
        num_predict: 500,
      },
    }, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    });

    console.log('✅ Ollama response:');
    console.log(response.data.message.content);
  } catch (error: any) {
    console.error('❌ Ollama error:');
    console.error(error.response?.data || error.message || error.code);
  }
}

testOllama();
