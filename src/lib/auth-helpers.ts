export type AppRole = "student" | "teacher" | "admin";

export type VerificationStatus = "not_applicable" | "pending" | "approved" | "rejected";

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  not_applicable: "—",
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
};

export const STUDENT_EMAIL_DOMAIN = "students.local";

/** Build the synthetic email used to sign students in by roll number. */
export function rollToEmail(roll: string): string {
  return `${roll.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}

export function isStudentEmail(email: string): boolean {
  return email.toLowerCase().endsWith(`@${STUDENT_EMAIL_DOMAIN}`);
}

export const ROLE_LABEL: Record<AppRole, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Administrator",
};

export function highestRole(roles: AppRole[]): AppRole {
  if (roles.includes("admin")) return "admin";
  if (roles.includes("teacher")) return "teacher";
  return "student";
}
