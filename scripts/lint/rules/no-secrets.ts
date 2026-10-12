import type { Rule } from "../types.js";

const SECRET_KEY = /(PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|APP_KEY|ENCRYPTION_KEY|PRIVATE_KEY)/i;
const NOT_A_SECRET = /(EXPIR|TTL|LIFETIME|DURATION|_FILE$|_URL$|_PATH$|_LENGTH$|_ENABLED$)/i;
const PLACEHOLDER =
  /(change|replace|your[-_]|example|placeholder|generate|random|^x+$|^[0-]+$|^<.*>$)/i;

export function isPlaceholder(value: string): boolean {
  return value === "" || PLACEHOLDER.test(value);
}

export const noSecrets: Rule = {
  id: "no-secrets",
  severity: "error",
  description:
    ".env.example secrets are empty or obvious placeholders (e.g. change-me) so no deployment ships a shared credential.",
  check(template) {
    return [...template.env]
      .filter(
        ([key, value]) => SECRET_KEY.test(key) && !NOT_A_SECRET.test(key) && !isPlaceholder(value),
      )
      .map(([key, value]) => ({
        message: `${key}=${value} looks like a real credential; use an empty value or a placeholder such as change-me`,
      }));
  },
};
