// Ponto de entrada da função Appwrite
  if (!variables || Object.keys(variables).length === 0) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: 'Variáveis de ambiente não definidas ou vazias.' }),
    };
  }

  const { 
    BACKBLAZE_BUCKET_AVULSAS, 
    B2_APPLICATION_KEY, 
    BACKBLAZE_ENDPOINT, 
    BACKBLAZE_BUCKET_TRILHA, 
    B2_APPLICATION_KEY_ID,
    file,
    fileName,
    command
  } = req.variables;

  const keyId = B2_APPLICATION_KEY_ID;
  const applicationKey = B2_APPLICATION_KEY;
  const bucketId = BACKBLAZE_BUCKET_TRILHA || BACKBLAZE_BUCKET_AVULSAS;

  if (!keyId || !applicationKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: 'Variáveis de ambiente B2_APPLICATION_KEY_ID e B2_APPLICATION_KEY são obrigatórias.' }),
    };
  }

  try {
    let authData;
    try {
      authData = await b2AuthorizeAccount(keyId, applicationKey);
    } catch (authError) {
      console.error("Erro específico na autenticação do Backblaze:", authError.response ? authError.response.data : authError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({ success: false, error: "Falha na autenticação com o Backblaze B2. Verifique suas chaves." }),
      };
    }

    const { apiUrl, authorizationToken } = authData;

    if (command === 'list objects') {
      const objects = await b2ListObjects(apiUrl, authorizationToken, bucketId);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, objects: objects }),
      };
    } else if (command === 'upload' && file && fileName && bucketId) {
      const uploadUrlData = await b2GetUploadUrl(apiUrl, authorizationToken, bucketId);
      const { uploadUrl, authorizationToken: uploadToken } = uploadUrlData;
      const fileData = Buffer.from(file, 'base64');
      const uploadResponse = await b2UploadFile(uploadUrl, uploadToken, fileName, fileData);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, fileInfo: uploadResponse }),
      };
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: 'Comando inválido ou parâmetros faltando.' }),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};

// Função para listar objetos
async function b2ListObjects(apiUrl, authorizationToken, bucketId) {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
    method: 'POST',
    headers: {
      'Authorization': authorizationToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bucketId: bucketId
    })
  });

  const data = await response.json();
  return data.files;
}

// Função para obter URL de upload
async function b2GetUploadUrl(apiUrl, authorizationToken, bucketId) {
  const response = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
    method: 'POST',
    headers: {
      'Authorization': authorizationToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      bucketId: bucketId
    })
  });

  const data = await response.json();
  return data;
}

// Função para fazer upload de arquivo
async function b2UploadFile(uploadUrl, uploadToken, fileName, fileData) {
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': uploadToken,
      'Content-Type': 'application/octet-stream',
      'X-Bz-File-Name': fileName
    },
    body: fileData
  });

  const data = await response.json();
  return data;
}

// Função para autorizar conta
async function b2AuthorizeAccount(keyId, applicationKey) {
  const response = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${keyId}:${applicationKey}`).toString('base64')
    }
  });

  const data = await response.json();
  return data;
}
