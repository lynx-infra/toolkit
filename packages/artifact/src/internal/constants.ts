export const bucketName = process.env['BUCKET_NAME']
export const repoName = process.env['GITHUB_REPOSITORY']
export const runId = process.env['GITHUB_RUN_ID']
export const endpoint = process.env['ENDPOINT']
export const region = process.env['REGION']
export const accesskey = process.env['ACCESS_KEY']
export const secretkey = process.env['SECRET_KEY']
export const objectKeyPrefix = `artifacts/${repoName}/${runId}`
