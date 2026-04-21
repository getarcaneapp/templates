import {
  validateComposeFilesInternal,
  validateSchemaInternal,
} from "./lib/validation.js";

async function main(): Promise<void> {
  await validateSchemaInternal();
  await validateComposeFilesInternal();
}

main().catch((error) => {
  console.error((error as Error).message || error);
  process.exit(1);
});
