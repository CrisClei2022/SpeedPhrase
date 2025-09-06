import { Client, Functions } from 'node-appwrite';
import axios from 'axios';  // Usaremos o axios para fazer as requisições HTTP à API do Backblaze

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  
  // Variáveis de ambiente para Backblaze
  const BACKBLAZE_BUCKETS = [
    process.env.BACKBLAZE_BUCKET_TRILHA,
    process.env.BACKBLAZE_BUCKET_AVULSAS
  ];
  
  const BACKBLAZE_ENDPOINT = `https://${process.env.BACKBLAZE_ENDPOINT}`;
  const B2_APPLICATION_KEY_ID = process.env.B2_APPLICATION_KEY_ID;
  const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
  
  // Função para autenticar na API do Backblaze
  const authenticateBackblaze = async () => {
    try {
      const response = await axios.post('https://api.backblaze.com/b2api/v2/b2_authorize_account', null, {
        auth: {
          username: B2_APPLICATION_KEY_ID,
          password: B2_APPLICATION_KEY,
        },
      });
      return response.data;
    } catch (err) {
      throw new Error('Falha na autenticação com o Backblaze: ' + err.message);
    }
  };

  // Função para listar os buckets no Backblaze
  const listBuckets = async () => {
    const authData = await authenticateBackblaze();
    const apiUrl = authData.apiUrl + '/b2api/v2/b2_list_buckets';
    
    try {
      const response = await axios.post(apiUrl, {
        accountId: authData.accountId
      }, {
        headers: {
          Authorization: authData.authorizationToken
        }
      });
      
      return response.data.buckets;
    } catch (err) {
      throw new Error('Erro ao listar buckets do Backblaze: ' + err.message);
    }
  };

  try {
    const buckets = await listBuckets();

    // Log de buckets encontrados
    log(`Buckets encontrados: ${buckets.length}`);

    // Respondendo com os dados dos buckets
    return res.json({ buckets });
    
  } catch (err) {
    error('Erro ao listar buckets: ' + err.message);
    return res.json({ error: 'Erro ao listar buckets' });
  }
};
