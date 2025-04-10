import {info} from '@actions/core'
import {ListArtifactsResponse, Artifact} from '../shared/interfaces'
import {createObjectStorageClient, handleError} from '../shared/tos-client'
import {bucketName, defaultObjectKeyPrefix} from '../constants'

// Limiting to 1000 for perf reasons
const maximumArtifactCount = 1000

export async function listArtifactsPublic(
  workflowRunId: number,
  repositoryOwner: string,
  repositoryName: string,
  latest = false
): Promise<ListArtifactsResponse> {
  const prefix = `artifacts/${repositoryOwner}/${repositoryName}/${workflowRunId}`
  const artifacts = await listArtifactsFromTOS(prefix, latest)

  return {
    artifacts
  }
}

export async function listArtifactsInternal(
  latest = false
): Promise<ListArtifactsResponse> {
  const artifacts = await listArtifactsFromTOS(defaultObjectKeyPrefix, latest)

  return {
    artifacts
  }
}

export async function listArtifactsFromTOS(
  prefix: string,
  latest = false
): Promise<Artifact[]> {
  const client = await createObjectStorageClient()

  let artifacts: Artifact[] = []

  try {
    const {data} = await client.listObjectsType2({
      bucket: bucketName,
      maxKeys: maximumArtifactCount,
      prefix
    })
    for (const obj of data.Contents) {
      const artifactName = obj.Key.slice(
        defaultObjectKeyPrefix.length + 1,
        obj.Key.length - 4
      )
      artifacts.push({
        name: artifactName,
        id: 0,
        size: obj.Size
      })
    }
  } catch (error) {
    handleError(error)
  }

  if (latest) {
    artifacts = filterLatest(artifacts)
  }

  info(`Found ${artifacts.length} artifact(s)`)
  return artifacts
}

/**
 * Filters a list of artifacts to only include the latest artifact for each name
 * @param artifacts The artifacts to filter
 * @returns The filtered list of artifacts
 */
function filterLatest(artifacts: Artifact[]): Artifact[] {
  artifacts.sort((a, b) => b.id - a.id)
  const latestArtifacts: Artifact[] = []
  const seenArtifactNames = new Set<string>()
  for (const artifact of artifacts) {
    if (!seenArtifactNames.has(artifact.name)) {
      latestArtifacts.push(artifact)
      seenArtifactNames.add(artifact.name)
    }
  }
  return latestArtifacts
}
