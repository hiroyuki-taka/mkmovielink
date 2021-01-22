import {Channel} from "../src/channel";
import * as log4js from 'log4js'

describe('channel', () => {

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
      new Channel().asObservable
        .subscribe(x => {
          console.log(x)
          resolve()
        })
    })
  })
})
