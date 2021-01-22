import {from, Observable} from "rxjs";
import axios, {AxiosInstance, AxiosResponse, AxiosTransformer, Method} from "axios";
import * as log4js from "log4js";

export class Http {
  readonly axiosInstance: AxiosInstance
  readonly logger: log4js.Logger

  constructor() {
    this.logger = log4js.getLogger('Http')
    this.axiosInstance = axios.create()

    this.axiosInstance.interceptors.request.use(config => {
      this.logger.info(`send http request. method: ${config.method}, url: ${config.url}, body: ${config.data ? JSON.stringify(config.data) : '<null>'}`)
      return config
    })
    this.axiosInstance.interceptors.response.use(response => {
      this.logger.info(`receive http response. data: ${response.data ? JSON.stringify(response.data) : '<null>'}`)
      return response
    })
  }

  request<T>(method: Method, url: string, transformResponse?: AxiosTransformer): Observable<AxiosResponse<T>> {
    return from(this.axiosInstance.request({url: url, method: method, transformResponse}))
  }
}
