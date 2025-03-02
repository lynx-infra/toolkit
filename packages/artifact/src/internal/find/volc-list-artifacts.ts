import {info} from '@actions/core'
import {ListArtifactsResponse, Artifact} from '../shared/interfaces'
import {createObjectStorageClient, handleError} from '../shared/tos-client'
import {bucketName, objectKeyPrefix} from '../constants'

// Limiting to 1000 for perf reasons
const maximumArtifactCount = 1000

export async function listArtifactsInternal(
  latest = false
): Promise<ListArtifactsResponse> {
  const client = await createObjectStorageClient()

  let artifacts: Artifact[] = []

  try {
    const {data} = await client.listObjectsType2({
      bucket: bucketName,
      maxKeys: maximumArtifactCount,
      prefix: objectKeyPrefix
    })
    for (const obj of data.Contents) {
      const artifactName = obj.Key.slice(
        objectKeyPrefix.length + 1,
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

  return {
    artifacts
  }
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
