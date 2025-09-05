const sdk = require('node-appwrite');
const axios = require('axios');
const crypto = require('crypto');

// Variáveis de ambiente
const B2_APPLICATION_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
const BACKBLAZE_BUCKET_AVULSAS = process.env.BACKBLAZE_BUCKET_AVULSAS;
const BACKBLAZE_BUCKET_TRILHA = process.env.BACKBLAZE_BUCKET_TRILHA;
const BACKBLAZE_ENDPOINT = process.env.BACKBLAZE_ENDPOINT;

module.exports = async ({ req, res, log, error }) => {
  log('Verificando variáveis de ambiente...');
  log('B2_APPLICATION_KEY_ID: ' + B2_APPLICATION_KEY_ID);
  log('B2_APPLICATION_KEY: ' + B2_APPLICATION_KEY);
  log('BACKBLAZE_BUCKET_AVULSAS: ' + BACKBLAZE_BUCKET_AVULSAS);
  log('BACKBLAZE_BUCKET_TRILHA: ' + BACKBLAZE_BUCKET_TRILHA);
  log('BACKBLAZE_ENDPOINT: ' + BACKBLAZE_ENDPOINT);

  if (!B2_APPLICATION_KEY_ID || !B2_APPLICATION_KEY || !BACKBLAZE_BUCKET_AVULSAS || !BACKBLAZE_BUCKET_TRILHA || !BACKBLAZE_ENDPOINT) {
    error('Variáveis de ambiente do Backblaze não configuradas corretamente.');
    return res.status(500).send('Erro de configuração do servidor.');
  }

  try {
    const body = JSON.parse(req.body || '{}');
    const { action, fileId, subtitleContent, fileName, bucketType } = body;

    if (!action) {
      return res.status(400).send('Parâmetro "action" é obrigatório.');
    }
    
    // Assegura que o tipo de bucket é válido
    if (!bucketType || (bucketType !== 'avulsas' && bucketType !== 'trilha')) {
      return res.status(400).send('Parâmetro "bucketType" inválido. Use "avulsas" ou "trilha".');
    }
    
    // Seleciona o bucket ID com base no tipo
    const bucketId = bucketType === 'avulsas' ? BACKBLAZE_BUCKET_AVULSAS : BACKBLAZE_BUCKET_TRILHA;
    const endpointUrl = `https://${BACKBLAZE_ENDPOINT}`;

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
async function getBackblazeAuthToken() {
  try {
    const response = await axios.post(`https://api.backblazeb2.com/b2api/v2/b2_authorize_account`, {
      keyId: B2_APPLICATION_KEY_ID,
      applicationKey: B2_APPLICATION_KEY
    });
    return response.data.authorizationToken;
  } catch (error) {
    console.error('Erro ao obter token de autorização do Backblaze:', error.response ? error.response.data : error.message);
    throw new Error('Falha ao autorizar com Backblaze.');
  }
}

/**
 * Obtém informações sobre o bucket, incluindo a URL de upload.
 * @param {string} bucketId O ID do bucket.
 * @param {string} endpoint O endpoint do bucket.
 * @returns {Promise<object>} Os dados do bucket.
 */
async function getBackblazeUploadUrl(bucketId, endpoint) {
  const authToken = await getBackblazeAuthToken();
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

/**
 * Faz o upload de um arquivo para o Backblaze B2.
 * @param {string} fileName O nome do arquivo a ser enviado.
 * @param {string} fileContent O conteúdo do arquivo.
 * @param {string} bucketId O ID do bucket.
 * @param {string} endpointUrl O endpoint do bucket.
 * @returns {Promise<object>} A resposta do upload.
 */
async function uploadToBackblaze(fileName, fileContent, bucketId, endpointUrl) {
  const uploadUrlData = await getBackblazeUploadUrl(bucketId, endpointUrl);
  const { uploadUrl, authorizationToken } = uploadUrlData;

  const sha1Hash = crypto.createHash('sha1').update(fileContent).digest('hex');

  try {
    const response = await axios.post(uploadUrl, fileContent, {
      headers: {
        'Authorization': authorizationToken,
        'Content-Type': 'text/plain',
        'X-Bz-File-Name': fileName,
        'X-Bz-Content-Sha1': sha1Hash
      }
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer upload para o Backblaze:', error.response ? error.response.data : error.message);
    throw new Error('Falha ao fazer upload para o Backblaze.');
  }
}

/**
 * Carrega um arquivo do Backblaze B2.
 * @param {string} fileId O ID do arquivo.
 * @param {string} bucketId O ID do bucket.
 * @param {string} endpointUrl O endpoint do bucket.
 * @returns {Promise<string>} O conteúdo do arquivo.
 */
async function loadFromBackblaze(fileId, bucketId, endpointUrl) {
  const authToken = await getBackblazeAuthToken();
  try {
    const response = await axios.get(`${endpointUrl}/b2api/v2/b2_download_file_by_id`, {
      params: { fileId: fileId },
      headers: { 'Authorization': `Bearer ${authToken}` },
      responseType: 'text'
    });
    return response.data;
  } catch (error) {
    console.error(`Erro ao carregar arquivo ${fileId} do Backblaze:`, error.response ? error.response.data : error.message);
    throw new Error(`Falha ao carregar arquivo ${fileId} do Backblaze.`);
  }
}

/**
 * Atualiza um arquivo existente no Backblaze B2.
 * @param {string} fileId O ID do arquivo.
 * @param {string} newFileContent O novo conteúdo do arquivo.
 * @param {string} bucketId O ID do bucket.
 * @param {string} endpointUrl O endpoint do bucket.
 * @returns {Promise<object>} A resposta da atualização.
 */
async function updateBackblazeFile(fileId, newFileContent, bucketId, endpointUrl) {
  const authToken = await getBackblazeAuthToken();
  let fileName;

  try {
    const fileInfoResponse = await axios.post(`https://api.backblazeb2.com/b2api/v2/b2_get_file_info`, 
      { fileId: fileId }, 
      { headers: { 'Authorization': `Bearer ${authToken}` }
    });
    fileName = fileInfoResponse.data.fileName;
  } catch (error) {
    console.error(`Erro ao obter informações do arquivo ${fileId}:`, error.response ? error.response.data : error.message);
    throw new Error(`Falha ao obter informações do arquivo ${fileId}.`);
  }

  return await uploadToBackblaze(fileName, newFileContent, bucketId, endpointUrl);
}
