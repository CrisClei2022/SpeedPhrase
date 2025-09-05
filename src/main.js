const sdk = require('node-appwrite');
const axios = require('axios');
const crypto = require('crypto'); // Biblioteca para SHA1 já existe no Node.js

// Para acessar as variáveis de ambiente configuradas no Appwrite
const BACKBLAZE_KEY_ID = process.env.BACKBLAZE_KEY_ID;
const BACKBLAZE_APPLICATION_KEY = process.env.BACKBLAZE_APPLICATION_KEY;
const BACKBLAZE_BUCKET_AVULSAS = process.env.BACKBLAZE_BUCKET_AVULSAS;
const BACKBLAZE_BUCKET_TRILHA = process.env.BACKBLAZE_BUCKET_TRILHA;
const BACKBLAZE_ENDPOINT = process.env.BACKBLAZE_ENDPOINT;

module.exports = async ({ req, res, log, error }) => {
  log('Função backblaze_api iniciada.');

  if (!BACKBLAZE_KEY_ID || !BACKBLAZE_APPLICATION_KEY || !BACKBLAZE_BUCKET_AVULSAS || !BACKBLAZE_BUCKET_TRILHA || !BACKBLAZE_ENDPOINT) {
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
    
    // 1. Decidimos qual bucket usar com base no bucketType
    const bucketId = bucketType === 'avulsas' ? BACKBLAZE_BUCKET_AVULSAS : BACKBLAZE_BUCKET_TRILHA;

    let responseData;

    switch (action) {
      case 'uploadFile':
        if (!subtitleContent || !fileName) {
          return res.status(400).send('Para upload, "subtitleContent" e "fileName" são obrigatórios.');
        }
        responseData = await uploadToBackblaze(fileName, subtitleContent, bucketId);
        break;

      case 'loadFile':
        if (!fileId) {
          return res.status(400).send('Para carregar, "fileId" é obrigatório.');
        }
        responseData = await loadFromBackblaze(fileId, bucketId);
        break;

      case 'updateFile':
        if (!fileId || !subtitleContent) {
          return res.status(400).send('Para atualizar, "fileId" e "subtitleContent" são obrigatórios.');
        }
        responseData = await updateBackblazeFile(fileId, subtitleContent, bucketId);
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

// ... O restante das funções (getBackblazeAuthToken, etc.) permanecem as mesmas
// Você precisará alterar as funções de upload, load e update para aceitar o bucketId
async function uploadToBackblaze(fileName, fileContent, bucketId) {
  const uploadUrlData = await getBackblazeUploadUrl(bucketId);
  // ... o restante da função
}

async function loadFromBackblaze(fileId, bucketId) {
  // ... o restante da função
}

async function updateBackblazeFile(fileId, newFileContent, bucketId) {
  // ... o restante da função
}
