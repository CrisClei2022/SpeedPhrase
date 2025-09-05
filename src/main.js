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
  log('Função backblaze_api iniciada.');

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

    if (!bucketType || (bucketType !== 'avulsas' && bucketType !== 'trilha')) {
      return res.status(400).send('Parâmetro "bucketType" inválido. Use "avulsas" ou "trilha".');
    }
    
    // Selecionamos o bucket com base no tipo
    const bucketId = bucketType === 'avulsas' ? BACKBLAZE_BUCKET_AVULSAS : BACKBLAZE_BUCKET_TRILHA;
    const endpointUrl = BACKBLAZE_ENDPOINT; // Usamos o mesmo endpoint para ambos

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

// As funções auxiliares (getBackblazeAuthToken, getBackblazeUploadUrl, etc.) permanecem as mesmas que eu te enviei por último.
