import axios from 'axios'
import Cfg from '../cfg'
import Cache from './cache'
console.log(Cfg)
const networkCache = Cache.getNetwork();
const network = Cfg[networkCache.value]||networkCache.value;

const RPC_ADDR = network.rpc||network;
const CHAIN_RPC_ADDR = RPC_ADDR;

// create an axios instance
const service = axios.create({
  baseURL: RPC_ADDR, // process.env.BASE_API, // api的base_url
  timeout: 30000 // request timeout
})

// request interceptor
service.interceptors.request.use(config => {
  config.params = Object.assign({
    m: config && config.data && config.data.method
  }, config.params)
  if (config.host == 'chain') {
    config.baseURL = CHAIN_RPC_ADDR
  } else {
    config.baseURL = RPC_ADDR
  }
  config.headers['Content-Type'] = 'application/json'
  return config
}, error => {
  // Do something with request error
  console.log(error) // for debug
  Promise.reject(error)
})

// respone interceptor
service.interceptors.response.use(
  response => {
    console.log("--------service.interceptors.response-------------\n",response.data)
    console.log("--------service.interceptors.response-------------\n")
    let data = response.data
    if (!data){
      console.log("--------service.interceptors.response-------------\n",response)
      console.log("--------service.interceptors.response-------------\n")
    }
    if (data.error) {
      console.log('err' + data.error)
      if (data.error.code == -32000) {
        return Promise.reject(data.error)
      }
      console.log(data)
      return Promise.reject(data.error)
    } else {
      return data.result !== undefined ? data.result : response
    }
  },
  
  error => {
    //    console.log('err' + error) // for debug
    if (error.code == -5) {
      return Promise.reject(error)
    }
    console.log(error)
    return Promise.reject(error)
  })

export function rpc(url, params, host) {
  console.log("--------rpc-------------\n",url,params,host,"\n--------rpc-------------\n")
  return service.request({
    url: '/',
    host: host,
    method: 'post',
    data: {
      jsonrpc: '2.0',
      method: url,
      params: params,
      id: new Date().getTime()
    }
  })
}

export default service