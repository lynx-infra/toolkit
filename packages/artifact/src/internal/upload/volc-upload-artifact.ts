import * as core from '@actions/core'
import {
  UploadArtifactOptions,
  UploadArtifactResponse
} from '../shared/interfaces'
import {validateArtifactName} from './path-and-artifact-name-validation'
import {
  UploadZipSpecification,
  getUploadZipSpecification,
  validateRootDirectory
} from './upload-zip-specification'
import {createZipUploadStream} from './zip'
import {FilesNotFoundError} from '../shared/errors'
import {createObjectStorageClient, handleError} from '../shared/tos-client'
import {bucketName, objectKeyPrefix} from '../constants'

export async function uploadArtifact(
  name: string,
  files: string[],
  rootDirectory: string,
  options?: UploadArtifactOptions | undefined
): Promise<UploadArtifactResponse> {
  validateArtifactName(name)
  validateRootDirectory(rootDirectory)

  const zipSpecification: UploadZipSpecification[] = getUploadZipSpecification(
    files,
    rootDirectory
  )
  if (zipSpecification.length === 0) {
    throw new FilesNotFoundError(
      zipSpecification.flatMap(s => (s.sourcePath ? [s.sourcePath] : []))
    )
  }

  const client = await createObjectStorageClient()

  const fileName = `${name}.zip`
  const objectKey = `${objectKeyPrefix}/${fileName}`

  const zipUploadStream = await createZipUploadStream(
    zipSpecification,
    options?.compressionLevel
  )
  try {
    await client.putObject({
      bucket: bucketName,
      key: objectKey,
      body: zipUploadStream
    })
  } catch (error) {
    handleError(error)
  }

  core.info(`Finalizing artifact upload`)

  const {data} = await client.headObject({
    bucket: bucketName,
    key: objectKey
  })

  return {
    size: Number(data['content-length']),
    digest: data['content-md5'],
    id: 0
  }
}
