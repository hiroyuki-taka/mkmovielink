import {interval, Observable, ReplaySubject, Subject, Subscription} from "rxjs";
import axios, {AxiosInstance, AxiosResponse, AxiosTransformer, Method} from "axios";
import * as log4js from "log4js";

export class Http {
  readonly logger: log4js.Logger
  readonly requestCache: Map<string, Subject<AxiosResponse<any>>>
  readonly axiosInstance: AxiosInstance
  readonly queue: [Method, string, AxiosTransformer?][]

  readonly timerSubscription: Subscription

  constructor() {
    this.logger = log4js.getLogger('Http')
    this.requestCache = new Map<string, Subject<AxiosResponse<any>>>()
    this.axiosInstance = axios.create()

    this.queue = []
    this.timerSubscription = interval(1200).subscribe(() => {
      this.logger.info('queue check', this.queue.length)
      const value = this.queue.pop()

      if (value) {
        const [method, url, transformResponse] = value
        const key = `${method}::${url}`
        const observer = this.requestCache.get(key)

        if (observer) {
          this.axiosInstance.request({method, url, transformResponse})
            .then(response => observer.next(response))
            .catch(reason => {
              observer.error(reason)
            })
            .finally(() => observer.complete())
        }
      }
    })

    this.axiosInstance.interceptors.request.use(config => {
      this.logger.info(`send http request. method: ${config.method}, url: ${config.url}, body: ${config.data ? this.abbreviate(JSON.stringify(config.data), 120) : '<null>'}`)
      return config
    })
    this.axiosInstance.interceptors.response.use(response => {
      this.logger.info(`receive http response. data: ${response.data ? this.abbreviate(JSON.stringify(response.data), 120) : '<null>'}`)
      return response
    })
  }

  abbreviate(s: string, maxLength: number): string {
    if (!s || s.length < maxLength - 3) {
      return s
    }
    return s.slice(0, maxLength - 3) + '...'
  }

  request<T>(method: Method, url: string, transformResponse?: AxiosTransformer): Observable<AxiosResponse<T>> {
    const key = `${method}::${url}`
    if (!this.requestCache.has(key)) {
      this.logger.info(`queueing: ${key}`)
      this.requestCache.set(key, new ReplaySubject(1))
      this.queue.push([method, url, transformResponse])
    }
    return this.requestCache.get(key) as Observable<AxiosResponse<T>>
  }

  dispose() {
    this.timerSubscription.unsubscribe()
  }
}
