import axios from 'axios';
import Cfg from '../../cfg';

// create an axios instance
const service = axios.create({
  baseURL: Cfg.asimov_child_rpc, // process.env.BASE_API, // api的base_url
  timeout: 30000, // request timeout
});

// request interceptor
service.interceptors.request.use(config => {
  config.params = Object.assign({
    m: config && config.data && config.data.method,
  }, config.params);
  // config.baseURL = Cfg.asimov_child_rpc
  config.headers['Content-Type'] = 'application/json';
  return config;
}, error => {
  // Do something with request error
  // console.log(error) // for debug
  Promise.reject(error);
});

// respone interceptor
service.interceptors.response.use( response => {
    const data = response.data;
    if (data.error) {
      // console.log('err' + data.error)
      if (data.error.code === -32000) {
        return Promise.reject(data.error);
      }
      // console.log(data)
      return Promise.reject(data.error);
    } else {
      return data.result !=== undefined ? data.result : response;
    }
  }, error => {
    if (error.code === -5) {
      return Promise.reject(error);
    }
    // console.log(error)
    return Promise.reject(error);
  });

export function child_rpc(url, params) {
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

