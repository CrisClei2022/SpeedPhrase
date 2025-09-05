const sdk = require('node-appwrite');
const axios = require('axios');

// Para acessar as variáveis de ambiente configuradas no Appwrite
const BACKBLAZE_KEY_ID = process.env.BACKBLAZE_KEY_ID;
const BACKBLAZE_APPLICATION_KEY = process.env.BACKBLAZE_APPLICATION_KEY;
const BACKBLAZE_BUCKET_NAME = process.env.BACKBLAZE_BUCKET_NAME; // Você precisará configurar isso também
const BACKBLAZE_ENDPOINT = process.env.BACKBLAZE_ENDPOINT; // Ex: 'https://s3.us-west-002.backblazeb2.com'

module.exports = async ({ req, res, log, error }) => {
  // Inicializa o cliente do Appwrite (opcional para funções HTTP simples)
  // const client = new sdk.Client();
  // client.setEndpoint('https://cloud.appwrite.io/v1').setProject('YOUR_PROJECT_ID').setKey('YOUR_API_KEY');

  log('Função backblaze_api iniciada.');

  // Verificação básica das variáveis de ambiente
  if (!BACKBLAZE_KEY_ID || !BACKBLAZE_APPLICATION_KEY || !BACKBLAZE_BUCKET_NAME || !BACKBLAZE_ENDPOINT) {
    error('Variáveis de ambiente do Backblaze não configuradas corretamente.');
    return res.status(500).send('Erro de configuração do servidor.');
  }

  try {
    const body = JSON.parse(req.body || '{}');
    const { action, fileId, subtitleContent, fileName } = body;

    if (!action) {
      return res.status(400).send('Parâmetro "action" é obrigatório.');
    }

    let responseData;

    switch (action) {
      case 'uploadFile': // Para upload inicial ou re-upload
        if (!subtitleContent || !fileName) {
          return res.status(400).send('Para upload, "subtitleContent" e "fileName" são obrigatórios.');
        }
        responseData = await uploadToBackblaze(fileName, subtitleContent);
        break;

      case 'loadFile':
        if (!fileId) {
          return res.status(400).send('Para carregar, "fileId" é obrigatório.');
        }
        responseData = await loadFromBackblaze(fileId);
        break;

      case 'updateFile': // Para salvar as edições
        if (!fileId || !subtitleContent) {
          return res.status(400).send('Para atualizar, "fileId" e "subtitleContent" são obrigatórios.');
        }
        responseData = await updateBackblazeFile(fileId, subtitleContent);
        break;

      default:
        return res.status(400).send(`Ação "${action}" não reconhecida.`);
    }

    log(`Ação "${action}" concluída com sucesso.`);
    res.status(200).json(responseData);

  } catch (err) {
    error(`Erro ao processar a requisição: ${err.message}`);
    res.status(500).send('Erro interno do servidor.');
  }
};

/**
 * Obtém um token de autorização para interagir com o Backblaze B2.
 * @returns {Promise<string>} O token de autorização.
 */
async function getBackblazeAuthToken() {
  try {
    const response = await axios.post('https://api.backblazeb2.com/v2/b2_authorize_account', {
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
 * Obtém informações sobre o bucket, incluindo o uploadUrl.
 * @returns {Promise<object>} Os dados do bucket.
 */
async function getBackblazeUploadUrl(bucketId) {
    const authToken = await getBackblazeAuthToken();
    try {
        const response = await axios.post(`${BACKBLAZE_ENDPOINT}/b2api/v2/b2_get_upload_url`, {
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
 * @returns {Promise<object>} A resposta do upload.
 */
async function uploadToBackblaze(fileName, fileContent) {
  const uploadUrlData = await getBackblazeUploadUrl(BACKBLAZE_BUCKET_NAME);
  const { uploadUrl, authorizationToken } = uploadUrlData;

  const sha1Hash = require('crypto').createHash('sha1').update(fileContent).digest('hex');

  try {
    const response = await axios.post(uploadUrl, fileContent, {
      headers: {
        'Authorization': authorizationToken,
        'Content-Type': 'text/plain', // Para arquivos .srt, o content type pode ser text/plain
        'X-Bz-File-Name': fileName,
        'X-Bz-Content-Sha1': sha1Hash,
        'X-Bz-Upload-Proof': sha1Hash // Necessário para alguns uploads
      }
    });
    return response.data; // Contém informações sobre o arquivo carregado
  } catch (error) {
    console.error('Erro ao fazer upload para o Backblaze:', error.response ? error.response.data : error.message);
    throw new Error('Falha ao fazer upload para o Backblaze.');
  }
}

/**
 * Carrega um arquivo do Backblaze B2.
 * @param {string} fileId O ID do arquivo a ser carregado.
 * @returns {Promise<string>} O conteúdo do arquivo.
 */
async function loadFromBackblaze(fileId) {
  const authToken = await getBackblazeAuthToken();
  try {
    // Para carregar arquivos, usamos b2_download_file_by_id
    const response = await axios.get(`https://api.backblazeb2.com/v2/b2_download_file_by_id`, {
        params: {
            fileId: fileId
        },
        headers: {
            'Authorization': `Bearer ${authToken}`
        },
        responseType: 'text' // Queremos o conteúdo como texto
    });
    return response.data; // Retorna o conteúdo da legenda
  } catch (error) {
    console.error(`Erro ao carregar arquivo ${fileId} do Backblaze:`, error.response ? error.response.data : error.message);
    throw new Error(`Falha ao carregar arquivo ${fileId} do Backblaze.`);
  }
}

/**
 * Atualiza um arquivo existente no Backblaze B2.
 * Para atualizar, na verdade, criamos um novo arquivo com o mesmo nome (ou usamos o fileId se soubermos como sobrescrever).
 * Uma abordagem comum é primeiro apagar o arquivo antigo e depois fazer o upload do novo.
 * Ou, dependendo da API, pode haver um método de "replace".
 * A forma mais simples e segura (e comum) é "upload" novamente com um novo file version.
 * @param {string} fileId O ID do arquivo a ser atualizado.
 * @param {string} newFileContent O novo conteúdo do arquivo.
 * @returns {Promise<object>} A resposta da atualização.
 */
async function updateBackblazeFile(fileId, newFileContent) {
    // Para simplificar, vamos obter o nome do arquivo original usando b2_get_file_info
    const authToken = await getBackblazeAuthToken();
    let fileName;

    try {
        const fileInfoResponse = await axios.get(`https://api.backblazeb2.com/v2/b2_get_file_info`, {
            params: { fileId: fileId },
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        fileName = fileInfoResponse.data.fileName;
    } catch (error) {
        console.error(`Erro ao obter informações do arquivo ${fileId}:`, error.response ? error.response.data : error.message);
        throw new Error(`Falha ao obter informações do arquivo ${fileId}.`);
    }

    // Agora fazemos o upload do novo conteúdo. O Backblaze criará uma nova versão.
    return await uploadToBackblaze(fileName, newFileContent);
}
