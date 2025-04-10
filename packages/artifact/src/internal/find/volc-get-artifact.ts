import {GetArtifactResponse} from '../shared/interfaces'
import {ArtifactNotFoundError} from '../shared/errors'
import {createObjectStorageClient, handleError} from '../shared/tos-client'
import {bucketName, defaultObjectKeyPrefix} from '../constants'

export async function getArtifactPublic(
  artifactName: string,
  workflowRunId: number,
  repositoryOwner: string,
  repositoryName: string,
): Promise<GetArtifactResponse> {
  const fileName = `${artifactName}.zip`
  const objectKey = `artifacts/${repositoryOwner}/${repositoryName}/${workflowRunId}/${fileName}`

  return await getArtifactFromTOS(artifactName, objectKey)
}

export async function getArtifactInternal(
  artifactName: string
): Promise<GetArtifactResponse> {
  const fileName = `${artifactName}.zip`
  const objectKey = `${defaultObjectKeyPrefix}/${fileName}`

  return await getArtifactFromTOS(artifactName, objectKey)
}

async function getArtifactFromTOS(
  artifactName: string,
  objectKey: string
): Promise<GetArtifactResponse> {
  const client = await createObjectStorageClient()

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
