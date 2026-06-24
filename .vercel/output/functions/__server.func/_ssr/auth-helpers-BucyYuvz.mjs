//#region node_modules/.nitro/vite/services/ssr/assets/auth-helpers-BucyYuvz.js
var VERIFICATION_LABEL = {
	not_applicable: "—",
	pending: "Pending approval",
	approved: "Approved",
	rejected: "Rejected"
};
var STUDENT_EMAIL_DOMAIN = "students.local";
/** Build the synthetic email used to sign students in by roll number. */
function rollToEmail(roll) {
	return `${roll.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}
var ROLE_LABEL = {
	student: "Student",
	teacher: "Teacher",
	admin: "Administrator"
};
function highestRole(roles) {
	if (roles.includes("admin")) return "admin";
	if (roles.includes("teacher")) return "teacher";
	return "student";
}
//#endregion
export { rollToEmail as i, VERIFICATION_LABEL as n, highestRole as r, ROLE_LABEL as t };
