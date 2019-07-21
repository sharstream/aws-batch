//app.js
'use strict';

const S3 = require('aws-sdk/clients/s3');
const s3 = new S3();
const API_VERSION = process.env.API_VERSION;
/**
 * {Promise} resolve function
 */
class s3Object {
  constructor(bucket, key) {
    /**
     * Instantiate S3 on the instance; future-proof to allow per-object config
     * changes.
     */
    this.s3 = new S3({ apiVersion: API_VERSION });
    this.bucket = bucket;
    this.key = key;
  }

  /**
   * get metadata
   */
  getMetadata() {
    const params = {
      Bucket: this.bucket,
      Key: this.key
    }
    new Promise((resolve, reject) => {
      s3.putObject(params, (err, data) => {
        if (err) {
          reject(err)
        } else {
          resolve(data.Metadata)
        }
      })
    })
  }
}
module.exports = s3Object;

// let classObj = new s3Object('test', 'key');
// console.log('building class...', classObj)