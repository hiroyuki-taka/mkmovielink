import {Channels} from "../src/channels";
import * as log4js from 'log4js'
import {HttpClient} from "../src/httpClient";

describe('channel', () => {
  const httpClient = new HttpClient()

  beforeEach(() => {
    log4js.configure({
      appenders: {
        out: {type: 'stdout'}
      },
      categories: {
        'default': {appenders: ['out'], level: 'all'},
        'Channel': {appenders: ['out'], level: 'all'}
      }
    })
  })

  afterEach(() => {
    log4js.shutdown(err => {
      if (err) throw err
    })
  })

  it('get', async () => {

    return new Promise(resolve => {
      new Channels(httpClient).asObservable
        .subscribe(x => {
          console.log(x)
          resolve()
        })
    })
  })
})
