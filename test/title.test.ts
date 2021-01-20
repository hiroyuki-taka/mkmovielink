import {Title} from "../src/title";

describe('title', () => {
  it('get', async () => {
    return new Promise((resolve, reject) => {
      new Title().next('5774')
    })
  })
})
