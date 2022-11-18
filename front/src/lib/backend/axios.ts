import Axios, { AxiosError } from 'axios';

import { updateAuthUserSession } from '../auth';
import { AxiosHeaders } from '../axios-headers';
import { tokenStorage } from '../token-storage';

export const axios = Axios.create({
  baseURL: import.meta.env.VITE_APP_BACKEND_URL,
});

// NOTE: retry 時の config.headers が壊れるので再定義する
axios.interceptors.request.use((config) => {
  config.headers = AxiosHeaders(tokenStorage.get('access_token'));
  return config;
});

axios.interceptors.response.use(
  undefined,
  async (err: AxiosError & { config: { __sent: boolean } }) => {
    const refreshToken = tokenStorage.get('refresh_token');
    if (!err.config || err.response?.status !== 401 || !refreshToken || err.config.__sent)
      return Promise.reject(err);
    try {
      err.config.__sent = true;
      await updateAuthUserSession();
      return axios(err.config);
    } catch (err) {
      return Promise.reject(err);
    }
  },
);
