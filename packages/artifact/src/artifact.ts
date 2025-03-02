import {ArtifactClient} from './internal/client'
import {DefaultArtifactClient} from './internal/volc-client'

export * from './internal/shared/interfaces'
export * from './internal/shared/errors'
export * from './internal/client'

const client: ArtifactClient = new DefaultArtifactClient()
export default client
