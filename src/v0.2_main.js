// Ponto de entrada da função Appwrite
export default async function(req, res) {
  const {BACKBLAZE_BUCKET_AVULSAS, B2_APPLICATION_KEY, BACKBLAZE_ENDPOINT, BACKBLAZE_BUCKET_TRILHA, B2_APPLICATION_KEY_ID} = req.variables;
  const { file, fileName, action } = req.variables;
  const keyId = B2_APPLICATION_KEY_ID;
  const applicationKey = B2_APPLICATION_KEY;
  const bucketId = BACKBLAZE_BUCKET_TRILHA || BACKBLAZE_BUCKET_AVULSAS;

  if (!keyId || !applicationKey) {
    return res.json({ success: false, error: 'Variáveis de ambiente B2_APPLICATION_KEY_ID e B2_APPLICATION_KEY são obrigatórias.' }, 400);
  }

  try {
    // -----------------------------------------------------------
    // NOVO CÓDIGO AQUI
    // Captura o erro da autenticação para debug
    let authData;
    try {
      authData = await b2AuthorizeAccount(keyId, applicationKey);
    } catch (authError) {
      console.error("Erro específico na autenticação do Backblaze:", authError.response ? authError.response.data : authError.message);
      return res.json({ success: false, error: "Falha na autenticação com o Backblaze B2. Verifique suas chaves." }, 500);
    }
    // -----------------------------------------------------------

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
