import axios from 'axios';

// Cria uma instância do Axios com configurações pré-definidas.
const apiClient = axios.create({
  /**
   * baseURL aponta para o seu backend.
   * Quando você roda o React localmente com `npm start` e o backend com Docker,
   * a porta 8000 do container do backend é mapeada para a porta 8000 da sua máquina.
   */
  baseURL: 'http://localhost:8000/api',
  
  // Define os cabeçalhos padrão para todas as requisições
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;