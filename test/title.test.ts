import {Titles} from "../src/titles";

describe('title', () => {
  const target = new Titles()

  it('get', async () => {
    return new Promise((resolve, reject) => {
      target.find('5774')
        .subscribe(titleItem => {
          console.log({...titleItem, LastUpdate: titleItem.LastUpdate.toJSON()})
          resolve()
        })
    })
  })
})
