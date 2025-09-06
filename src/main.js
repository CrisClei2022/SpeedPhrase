import axios from 'axios';

// Função para autenticar no Backblaze e obter o token de autorização e a URL da API.
const authenticateBackblaze = async (keyId, appKey) => {
  try {
    const response = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      auth: {
        username: keyId,
        password: appKey,
      },
    });
    return response.data;
  } catch (err) {
    // Lança um erro claro se a autenticação falhar.
    throw new Error('Falha na autenticação com o Backblaze: ' + (err.response?.data?.message || err.message));
  }
};

// Função principal que será executada pelo Appwrite.
export default async ({ res, log, error }) => {
  // Validação das variáveis de ambiente.
  const { B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY } = process.env;
  if (!B2_APPLICATION_KEY_ID || !B2_APPLICATION_KEY) {
    error('As variáveis de ambiente B2_APPLICATION_KEY_ID e B2_APPLICATION_KEY são obrigatórias.');
    return res.json({ success: false, message: 'Variáveis de ambiente do Backblaze não configuradas.' }, 500);
  }

  try {
    // 1. Autenticar no Backblaze.
    const authData = await authenticateBackblaze(B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY);
    log('Autenticação com Backblaze bem-sucedida.');

    const { apiUrl, authorizationToken, accountId } = authData;

    // 2. Montar a requisição para listar os buckets.
    const listBucketsUrl = `${apiUrl}/b2api/v2/b2_list_buckets`;
    const listBucketsResponse = await axios.post(
      listBucketsUrl,
      { accountId: accountId }, // Body da requisição
      {
        headers: {
          Authorization: authorizationToken // Header de autorização
        }
      }
    );

    log(`Encontrados ${listBucketsResponse.data.buckets.length} buckets.`);

    // 3. Retornar a lista de buckets com sucesso.
    return res.json({
      success: true,
      buckets: listBucketsResponse.data.buckets,
    });

  } catch (err) {
    // Captura qualquer erro no processo e o registra.
    error('Erro ao processar a requisição para o Backblaze: ' + err.message);
    return res.json({ success: false, message: 'Erro interno ao listar os buckets.' }, 500);
  }
};
