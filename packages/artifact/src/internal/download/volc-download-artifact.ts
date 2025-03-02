import {promises as fs, createReadStream} from 'fs'
import * as core from '@actions/core'
import * as path from 'path'
import unzip from 'unzip-stream'
import {
  Artifact,
  DownloadArtifactOptions,
  DownloadArtifactResponse
} from '../shared/interfaces'
import {getGitHubWorkspaceDir} from '../shared/config'
import {ArtifactNotFoundError} from '../shared/errors'
import {createObjectStorageClient, handleError} from '../shared/tos-client'
import {bucketName, objectKeyPrefix} from '../constants'
import {DefaultArtifactClient} from '../volc-client'

async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path)
    return true
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false
    } else {
      throw error
    }
  }
}

export async function downloadArtifactInternal(
  artifactId: number,
  options?: DownloadArtifactOptions
): Promise<DownloadArtifactResponse> {
  const downloadPath = await resolveOrCreateDirectory(options?.path)
  const artifactClient = new DefaultArtifactClient()
  const tosClient = await createObjectStorageClient()

  let artifacts: Artifact[] = []
  if (options?.artifactName) {
    const response = await artifactClient.getArtifact(options.artifactName)
    artifacts = [response.artifact]
  } else {
    artifacts = (await artifactClient.listArtifacts()).artifacts
  }

  if (artifacts.length === 0) {
    throw new ArtifactNotFoundError(
      `No artifacts found for ID: ${artifactId}\nAre you trying to download from a different run? Try specifying a github-token with \`actions:read\` scope.`
    )
  }

  if (artifacts.length > 1) {
    core.warning('Multiple artifacts found, defaulting to first.')
  }

  try {
    core.info(`Starting download of artifact to: ${downloadPath}`)

    const fileName = `${artifacts[0].name}.zip`
    const objectKey = `${objectKeyPrefix}/${fileName}`
    const filePath = path.join(downloadPath, fileName)
    await tosClient.getObjectToFile({
      bucket: bucketName,
      key: objectKey,
      filePath
    })
    // TODO: delete zip file after extraction
    createReadStream(filePath).pipe(unzip.Extract({path: downloadPath}))
    core.info(`Artifact download completed successfully.`)
  } catch (error) {
    handleError(error)
    throw new Error(`Unable to download and extract artifact: ${error.message}`)
  }

  return {downloadPath}
}

async function resolveOrCreateDirectory(
  downloadPath = getGitHubWorkspaceDir()
): Promise<string> {
  if (!(await exists(downloadPath))) {
    core.debug(
      `Artifact destination folder does not exist, creating: ${downloadPath}`
    )
    await fs.mkdir(downloadPath, {recursive: true})
  } else {
    core.debug(`Artifact destination folder already exists: ${downloadPath}`)
  }

  return downloadPath
}
