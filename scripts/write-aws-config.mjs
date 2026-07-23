// Reads the Pulumi stack outputs (JSON) from the TRIVIA_OUTPUTS env var — CI
// fetches that from the `trivia-frontend-config` SSM parameter — and writes
// frontend/src/services/AWSConfig.js, the named `AWSConfig` export that
// frontend/src/services/{Api,Cognito}.js and components/CognitoUI.vue import.
// Gitignored (see .gitignore: frontend/src/services/AWSConfig.js) — generated
// fresh on every CI run, never committed.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const raw = process.env.TRIVIA_OUTPUTS
if (!raw) {
  console.error('ERROR: TRIVIA_OUTPUTS env var is not set')
  process.exit(1)
}

let outputs
try {
  outputs = JSON.parse(raw)
} catch (error) {
  console.error('ERROR: TRIVIA_OUTPUTS is not valid JSON:', error.message)
  process.exit(1)
}

const required = ['region', 'httpApiUrl', 'wsApiUrl', 'identityPoolId', 'userPoolId', 'appClientId']
const missing = required.filter((key) => outputs[key] === undefined || outputs[key] === null)
if (missing.length > 0) {
  console.error(`ERROR: TRIVIA_OUTPUTS is missing required key(s): ${missing.join(', ')}`)
  process.exit(1)
}

const config = {
  region: outputs.region,
  httpapi: outputs.httpApiUrl,
  wsapi: outputs.wsApiUrl,
  identityPoolId: outputs.identityPoolId,
  userPoolId: outputs.userPoolId,
  appClientId: outputs.appClientId,
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(scriptDir, '..', 'frontend', 'src', 'services', 'AWSConfig.js')

writeFileSync(outPath, `export const AWSConfig = ${JSON.stringify(config, null, 2)};\n`)

console.log(`Wrote ${outPath}`)
