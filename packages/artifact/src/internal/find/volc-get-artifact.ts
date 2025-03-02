import {GetArtifactResponse} from '../shared/interfaces'
import {ArtifactNotFoundError} from '../shared/errors'
import {createObjectStorageClient, handleError} from '../shared/tos-client'
import {bucketName, objectKeyPrefix} from '../constants'

export async function getArtifactInternal(
  artifactName: string
): Promise<GetArtifactResponse> {
  const client = await createObjectStorageClient()

  const fileName = `${artifactName}.zip`
  const objectKey = `${objectKeyPrefix}/${fileName}`

  let data = {}
  try {
    data = await client.headObject({
      bucket: bucketName,
      key: objectKey
    })
  } catch (error) {
    handleError(error)
    throw new ArtifactNotFoundError(
      `Artifact not found for name: ${artifactName}
        Please ensure that your artifact is not expired and the artifact was uploaded using a compatible version of toolkit/upload-artifact.
        For more information, visit the GitHub Artifacts FAQ: https://github.com/actions/toolkit/blob/main/packages/artifact/docs/faq.md`
    )
  }

  return {
    artifact: {
      name: artifactName,
      id: 0,
      size: Number(data['content-length']),
      createdAt: undefined
    }
  }
}
