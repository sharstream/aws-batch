'use strict';

let s3Object = require('../app.js.js');
jest.mock('../app');

jest.fn().mockImplementation(() => Promise.resolve(value));

test('gets metadata', async () => {
  const s3 = new s3Object('test-bucket', 'test-key');
  s3.getMetadata.mockResolvedValue({ metadata: 'AWS'})
  const metadata = s3.getMetadata();
  console.log(metadata)
  // expect(metadata).toHaveBeenCalled();
  expect(metadata).resolves.toEqual({metadata: 'AWS'});
})

test('async test', async () => {
  const asyncMock = jest.fn().mockResolvedValue(43);

  await asyncMock(); // 43
});