import {Channel} from "../src/channel";

describe('channel', () => {
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
