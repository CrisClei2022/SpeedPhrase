import axios from 'axios';

// As chaves de API estão inseridas aqui.
// Preencha os valores abaixo com as suas credenciais.
const B2_APPLICATION_KEY_ID = "0054c259520eefa0000000002";
const B2_APPLICATION_KEY = "K005IT9onR82TC2e5P9zZdT5HodLE7Q";
const BACKBLAZE_BUCKET_TRILHA = "443c02f5b925e2109e8e0f1a";
const BACKBLAZE_BUCKET_AVULSAS = "947ca295b925e2109e8e0f1a";

// Funções para a API Backblaze B2
async function b2AuthorizeAccount(keyId, applicationKey) {
  const url = 'https://api.backblazeb2.com/b2api/v2/b2_authorize_account';
  const credentials = Buffer.from(`${keyId}:${applicationKey}`).toString('base64');
  const headers = { 'Authorization': `Basic ${credentials}` };
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('Erro na autenticação:', error.message);
    throw error;
  }
}

async function b2GetUploadUrl(apiUrl, authToken, bucketId) {
  const url = `${apiUrl}/b2api/v2/b2_get_upload_url`;
  const headers = { 'Authorization': authToken, 'Content-Type': 'application/json' };
  const data = { bucketId: bucketId };
  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error('Erro ao obter URL de upload:', error.message);
    throw error;
  }
}

async function b2UploadFile(uploadUrl, uploadToken, fileName, fileData) {
  const headers = {
    'Authorization': uploadToken,
    'X-Bz-File-Name': encodeURIComponent(fileName),
    'Content-Type': 'b2/x-auto',
    'X-Bz-Content-Sha1': 'do_not_verify'
  };
  try {
    const response = await axios.post(uploadUrl, fileData, { headers });
    return response.data;
  } catch (error) {
    console.error('Erro ao fazer upload do arquivo:', error.message);
    throw error;
  }
}

async function b2ListBuckets(apiUrl, authToken, accountId) {
  const url = `${apiUrl}/b2api/v2/b2_list_buckets`;
  const headers = { 'Authorization': authToken, 'Content-Type': 'application/json' };
  const data = { accountId: accountId };
  try {
    const response = await axios.post(url, data, { headers });
    return response.data.buckets;
  } catch (error) {
    console.error('Erro ao listar buckets:', error.message);
    throw error;
  }
}

// ===================================
// Ponto de entrada da função Appwrite
// ===================================
export default async function(req, res) {
  // Ajuste aqui: leia os dados diretamente do corpo da requisição (req.body)
  const requestData = req.body ?? '{}';
  const { file, fileName, action } = JSON.parse(requestData);
  const keyId = B2_APPLICATION_KEY_ID;
  const applicationKey = B2_APPLICATION_KEY;
  const bucketId = BACKBLAZE_BUCKET_TRILHA || BACKBLAZE_BUCKET_AVULSAS;

  if (!keyId || !applicationKey) {
    return res.json({ success: false, error: 'As chaves de API do B2 não foram preenchidas no código.' }, 400);
  }

  try {
    let authData;
    try {
      authData = await b2AuthorizeAccount(keyId, applicationKey);
    } catch (authError) {
      console.error("Erro específico na autenticação do Backblaze:", authError.response ? authError.response.data : authError.message);
      return res.json({ success: false, error: "Falha na autenticação com o Backblaze B2. Verifique suas chaves." }, 500);
    }

    const { apiUrl, authorizationToken } = authData;

    if (action === 'listBuckets') {
      const buckets = await b2ListBuckets(apiUrl, authorizationToken, authData.accountId);
      return res.json({ success: true, buckets: buckets });
    } else if (action === 'upload' && file && fileName && bucketId) {
      const uploadUrlData = await b2GetUploadUrl(apiUrl, authorizationToken, bucketId);
      const { uploadUrl, authorizationToken: uploadToken } = uploadUrlData;
      const fileData = Buffer.from(file, 'base64');
      const uploadResponse = await b2UploadFile(uploadUrl, uploadToken, fileName, fileData);
      return res.json({ success: true, fileInfo: uploadResponse });
    } else {
      return res.json({ success: false, error: 'Ação inválida ou parâmetros faltando.' }, 400);
    }
  } catch (error) {
    return res.json({ success: false, error: error.message }, 500);
  }
};
