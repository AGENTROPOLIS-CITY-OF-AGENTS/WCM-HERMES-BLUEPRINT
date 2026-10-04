import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');
const schemaDir = join(repoRoot, 'schemas');

export function readJson(relativePath) {
  return JSON.parse(readFileSync(join(repoRoot, relativePath), 'utf8'));
}

export function createValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: true, allowUnionTypes: true });
  addFormats(ajv);
  for (const file of readdirSync(schemaDir).filter((f) => f.endsWith('.schema.json'))) {
    const schema = JSON.parse(readFileSync(join(schemaDir, file), 'utf8'));
    ajv.addSchema(schema, schema.$id);
  }
  return ajv;
}

export function compile(schemaFile) {
  const ajv = createValidator();
  const schema = readJson(join('schemas', schemaFile));
  return ajv.getSchema(schema.$id);
}

export function errorsOf(validate) {
  return (validate.errors ?? []).map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
}
