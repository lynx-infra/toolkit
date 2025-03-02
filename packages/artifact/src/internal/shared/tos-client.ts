import {TosClient, TosClientError, TosServerError} from '@volcengine/tos-sdk'
import {endpoint, accesskey, secretkey, region} from '../constants'
import * as core from '@actions/core'

export function handleError(error): void {
  if (error instanceof TosClientError) {
    core.error(`Client Err Msg: ${error.message}`)
    core.error(`Client Err Stack: ${error.stack}`)
  } else if (error instanceof TosServerError) {
    core.error(`Request ID: ${error.requestId}`)
    core.error(`Response Status Code: ${error.statusCode}`)
    core.error(`Response Header: ${error.headers}`)
    core.error(`Response Err Code: ${error.code}`)
    core.error(`Response Err Msg: ${error.message}`)
  } else {
    core.error(`unexpected exception, message: ${error}`)
  }
}

export async function createObjectStorageClient(): Promise<TosClient> {
  const opts = endpoint ? {endpoint, secure: false} : {secure: true}

  return new TosClient({
    accessKeyId: accesskey!,
    accessKeySecret: secretkey!,
    region: region!,
    ...opts
  })
}
