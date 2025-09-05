const sdk = require('node-appwrite');
const axios = require('axios');
const crypto = require('crypto');

// Variáveis de ambiente
const BACKBLAZE_KEY_ID = process.env.BACKBLAZE_KEY_ID;
const BACKBLAZE_APPLICATION_KEY = process.env.BACKBLAZE_APPLICATION_KEY;
const BACKBLAZE_BUCKET_AVULSAS = process.env.BACKBLAZE_BUCKET_AVULSAS;
const BACKBLAZE_BUCKET_TRILHA = process.env.BACKBLAZE_BUCKET_TRILHA;
const BACKBLAZE_ENDPOINT_AVULSAS = process.env.BACKBLAZE_ENDPOINT_AVULSAS;
const BACKBLAZE_ENDPOINT_TRILHA = process.env.BACKBLAZE_ENDPOINT_TRILHA;

module.exports = async ({ req, res, log, error }) => {
  log('Função backblaze_api iniciada.');

  if (!BACKBLAZE_KEY_ID || !BACKBLAZE_APPLICATION_KEY || !BACKBLAZE_BUCKET_AVULSAS || !BACKBLAZE_BUCKET_TRILHA || !BACKBLAZE_ENDPOINT_AVULSAS || !BACKBLAZE_ENDPOINT_TRILHA) {
    error('Variáveis de ambiente do Backblaze não configuradas corretamente.');
    return res.status(500).send('Erro de configuração do servidor.');
  }

  try {
    const body = JSON.parse(req.body || '{}');
    const { action, fileId, subtitleContent, fileName, bucketType } = body;

    if (!action) {
      return res.status(400).send('Parâmetro "action" é obrigatório.');
    }

    if (!bucketType || (bucketType !== 'avulsas' && bucketType !== 'trilha')) {
      return res.status(400).send('Parâmetro "bucketType" inválido. Use "avulsas" ou "trilha".');
    }

    // Selecionamos o bucket e o endpoint com base no tipo
    const bucketId = bucketType === 'avulsas' ? BACKBLAZE_BUCKET_AVULSAS : BACKBLAZE_BUCKET_TRILHA;
    const endpointUrl = bucketType === 'avulsas' ? BACKBLAZE_ENDPOINT_AVULSAS : BACKBLAZE_ENDPOINT_TRILHA;

    let responseData;

    switch (action) {
      case 'uploadFile':
        if (!subtitleContent || !fileName) {
          return res.status(400).send('Para upload, "subtitleContent" e "fileName" são obrigatórios.');
        }
        responseData = await uploadToBackblaze(fileName, subtitleContent, bucketId, endpointUrl);
        break;

      case 'loadFile':
        if (!fileId) {
          return res.status(400).send('Para carregar, "fileId" é obrigatório.');
        }
        responseData = await loadFromBackblaze(fileId, bucketId, endpointUrl);
        break;

      case 'updateFile':
        if (!fileId || !subtitleContent) {
          return res.status(400).send('Para atualizar, "fileId" e "subtitleContent" são obrigatórios.');
        }
        responseData = await updateBackblazeFile(fileId, subtitleContent, bucketId, endpointUrl);
        break;

      default:
        return res.status(400).send(`Ação "${action}" não reconhecida.`);
    }

    log(`Ação "${action}" em "${bucketType}" concluída com sucesso.`);
    res.status(200).json(responseData);

  } catch (err) {
    error(`Erro ao processar a requisição: ${err.message}`);
    res.status(500).send('Erro interno do servidor.');
  }
};

/**
 * Obtém um token de autorização.
 * @param {string} endpoint O endpoint do bucket.
 * @returns {Promise<string>} O token de autorização.
 */
async function getBackblazeAuthToken(endpoint) {
  try {
    const response = await axios.post(`${endpoint}/b2api/v2/b2_authorize_account`, {
      keyId: BACKBLAZE_KEY_ID,
      applicationKey: BACKBLAZE_APPLICATION_KEY
    });
    return response.data.authorizationToken;
  } catch (error) {
    console.error('Erro ao obter token de autorização do Backblaze:', error.response ? error.response.data : error.message);
    throw new Error('Falha ao autorizar com Backblaze.');
  }
}

/**
 * Obtém informações sobre o bucket.
 * @param {string} bucketId O ID do bucket.
 * @param {string} endpoint O endpoint do bucket.
 * @returns {Promise<object>} Os dados do bucket.
 */
async function getBackblazeUploadUrl(bucketId, endpoint) {
  const authToken = await getBackblazeAuthToken(endpoint);
  try {
    const response = await axios.post(`${endpoint}/b2api/v2/b2_get_upload_url`, {
      bucketId: bucketId
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao obter URL de upload do Backblaze:', error.response ? error.response.data : error.message);
    throw new Error('Falha ao obter URL de upload do Backblaze.');
  }
}

async function uploadToBackblaze(fileName, fileContent, bucketId, endpointUrl) {
  const uploadUrlData = await getBackblazeUploadUrl(bucketId, endpointUrl);
  // ... o restante da função
}

async function loadFromBackblaze(fileId, bucketId, endpointUrl) {
  const authToken = await getBackblazeAuthToken(endpointUrl);
  // ... o restante da função
}

async function updateBackblazeFile(fileId, newFileContent, bucketId, endpointUrl) {
  const authToken = await getBackblazeAuthToken(endpointUrl);
  // ... o restante da função
}
