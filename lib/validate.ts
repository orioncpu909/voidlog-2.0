// Sign-up checks. These catch typos and made-up details, but only a sent email or text can prove an
// address or number is really theirs, and that needs a server.
const INVISIBLE = /[​-‍⁠﻿]/g;
const NAME = /^\p{L}[\p{L}\p{M}'’ .-]*$/u;
const EMAIL = /^[A-Za-z0-9_%+'-]+(\.[A-Za-z0-9_%+'-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;
const INSTAGRAM = /^(?!.*\.\.)(?!.*\.$)[A-Za-z0-9._]{1,30}$/; // no double periods, none at the end

export const NAME_MAX = 50;
export const EMAIL_MAX = 254;

export const cleanName = (name: string) => name.replace(INVISIBLE, "").replace(/\s+/g, " ").trim();
export const cleanEmail = (email: string) => email.trim().toLowerCase();

// A pasted profile link works as well as a handle.
export function cleanInstagram(input: string): string {
  return input
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/[/?].*$/, "")
    .replace(/^@/, "");
}

// The 10 digits of a US number, without a leading 1.
export function phoneNumber(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 11 && digits[0] === "1" ? digits.slice(1) : digits;
}

export function nameError(input: string, label: string, whose = "your"): string {
  const name = cleanName(input);
  if (!name) return `Enter ${whose} ${label} name.`;
  if (name.length > NAME_MAX) return `Keep it to ${NAME_MAX} characters.`;
  if (!NAME.test(name) || name.replace(/[^\p{L}]/gu, "").length < 2) return `Enter ${whose} real ${label} name, using letters only.`;
  return "";
}

export function emailError(input: string): string {
  const email = cleanEmail(input);
  return email.length <= EMAIL_MAX && EMAIL.test(email) ? "" : "Enter an email like name@example.com.";
}

export function phoneError(input: string): string {
  const number = phoneNumber(input);
  if (/[^\d\s+().-]/.test(input) || !/^[2-9]\d{2}[2-9]\d{6}$/.test(number) || /^(\d)\1+$/.test(number)) return "Enter a real 10-digit US mobile number.";
  return "";
}

export function instagramError(handle: string): string {
  return !handle || INSTAGRAM.test(handle) ? "" : "Use letters, numbers, periods and underscores (up to 30).";
}
