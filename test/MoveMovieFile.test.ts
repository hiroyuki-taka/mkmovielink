import {MoveMovieFile} from "../src/MoveMovieFile";
import * as log4js from "log4js";

describe('MoveMovieFile', () => {

  const target = new MoveMovieFile()

  beforeEach(() => {
    log4js.configure({
      appenders: {
        out: {type: 'stdout'}
      },
      categories: {
        'default': {appenders: ['out'], level: 'all'},
      }
    })
  })

  afterEach(() => {
    log4js.shutdown(err => {
      if (err) throw err
    })
  })


  it('execute', async function () {
    this.timeout(20000)

    return new Promise((resolve, reject) => {
      target.execute('D:\\movie\\encoded\\アニメ／特撮', 'W:\\movie')
        .subscribe((x) => {
            console.log(JSON.stringify(x).slice(0, 300))
          },
          error => reject(error),
          () => resolve())

    })
  })
})
