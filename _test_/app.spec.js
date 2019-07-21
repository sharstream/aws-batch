'use strict';

const s3Object = require('../app').s3Object;

jest.fn().mockImplementation(() => Promise.resolve(value));

test('async test', async () => {
  const asyncMock = jest.fn().mockResolvedValue(43);

  await asyncMock(); // 43
});