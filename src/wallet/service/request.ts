import axios from 'axios';
import Cfg from '../../cfg';

// create an axios instance
const service = axios.create({
  baseURL: Cfg.asimov_chain_rpc, // process.env.BASE_API, // api的base_url
  timeout: 30000, // request timeout
});

// request interceptor
service.interceptors.request.use(config => {
  config.params = Object.assign({
    m: config && config.data && config.data.method,
  }, config.params);
  config.baseURL = Cfg.asimov_chain_rpc;
  config.headers['Content-Type'] = 'application/json';
  return config;
}, error => {
  // Do something with request error
  console.error(error); // for debug
  Promise.reject(error);
});

// respone interceptor
service.interceptors.response.use(
  response => {

    const data = response.data;

    if (data.error) {
      console.error('err' + data.error);
      if (data.error.code === -32000) {
        return Promise.reject(data.error);
      }
      console.error(data);
      return Promise.reject(data.error);
    } else {
      return data.result !=== undefined ? data.result : response;
    }
  },

  error => {
    //    console.log('err' + error) // for debug
    if (error.code === -5) {
      return Promise.reject(error);
    }
    console.error(error);
    return Promise.reject(error);
  });

export function rpc(url, params) {
  return service.request({
    url: '/',
    method: 'post',
    data: {
      jsonrpc: '2.0',
      method: url,
      params,
      id: new Date().getTime(),
    },
  });
}
