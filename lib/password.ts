// Password rules, in one place so a future server can enforce the same ones. Right now they only
// run in the sign-up form: there's no server yet, and the password is never stored or sent.
// zxcvbn is passed in rather than imported because it's large and only sign-up needs it.
// zxcvbn's built-in list of common passwords covers the top 10k. A haveibeenpwned check belongs on
// the server, since this screen promises nothing leaves the device.
import type zxcvbn from "zxcvbn";

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MIN_SCORE = 3; // zxcvbn's 0-4 scale
const MAX_CHECKED_LENGTH = 100; // zxcvbn slows down on very long input

export const STRENGTH_LABELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];

export type PasswordCheck = {
  ok: boolean;
  score: number;
  problems: string[]; // what still has to change, most important first
};

export function checkPassword(password: string, score: typeof zxcvbn, userInputs: string[] = []): PasswordCheck {
  const result = score(password.slice(0, MAX_CHECKED_LENGTH), userInputs);
  const common = result.sequence.some((m) => m.pattern === "dictionary" && m.dictionary_name === "passwords" && m.token.length === password.length);
  const problems = [
    password.length >= PASSWORD_MIN_LENGTH ? "" : `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
    /[A-Z]/.test(password) ? "" : "Add an uppercase letter.",
    /[a-z]/.test(password) ? "" : "Add a lowercase letter.",
    /[0-9]/.test(password) ? "" : "Add a number.",
    /[^A-Za-z0-9]/.test(password) ? "" : "Add a symbol.",
    common ? "That's a very common password. Pick something else." : "",
  ].filter(Boolean);
  if (!problems.length && result.score < PASSWORD_MIN_SCORE) problems.push("Too easy to guess. Try a few unrelated words.");
  return { ok: !problems.length, score: result.score, problems };
}
