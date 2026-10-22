import type { CoursePolicy, Student, CourseData } from '../types';

export const mockStudent: Student = {
  student_id: "STU-2026-001",
  name: "Aarav Patel",
  email: "aarav@example.edu",
  department: "Data Science",
  semester: 5
};

/**
 * Standard College Course Policies:
 * Total Availability: 100 Marks
 * - Internal Continuous Assessment (ICA): 50 Marks (50% Weightage)
 *   Formed by internal components (ICA 1 to ICA 6 / Attendance / Midterms / Labs / Projects)
 * - Term End Examination (TEE): 50 Marks (50% Weightage)
 */
export const coursePolicies: Record<string, CoursePolicy> = {
  "ML101": {
    course_id: "ML101",
    course_name: "Machine Learning",
    semester: 5,
    faculty: "Dr. XYZ",
    components: [
      { name: "Attendance", type: "attendance", weight: 5, rules: { required: true, minimum_percentage: 75 } },
      { name: "Assignment 1 (ICA 1)", type: "assignment", weight: 10 },
      { name: "Midterm Exam (ICA 2)", type: "exam", weight: 15 },
      { name: "Lab Practicals (ICA 3)", type: "lab", weight: 10 },
      { name: "Course Project (ICA 4)", type: "project", weight: 10 },
      { name: "Term End Examination (TEE)", type: "exam", weight: 50 }
    ]
  },
  "SE201": {
    course_id: "SE201",
    course_name: "Software Engineering",
    semester: 5,
    faculty: "Prof. ABC",
    components: [
      { name: "Attendance", type: "attendance", weight: 5, rules: { required: true, minimum_percentage: 80 } },
      { name: "Quiz 1 (ICA 1)", type: "quiz", weight: 5 },
      { name: "Quiz 2 (ICA 2)", type: "quiz", weight: 5 },
      { name: "Lab Submissions (ICA 3)", type: "lab", weight: 15 },
      { name: "Agile Project (ICA 4)", type: "project", weight: 15 },
      { name: "Code Review & Viva (ICA 5)", type: "assignment", weight: 5 },
      { name: "Term End Examination (TEE)", type: "exam", weight: 50 }
    ]
  },
  "TS301": {
    course_id: "TS301",
    course_name: "Applied Time Series",
    semester: 5,
    faculty: "Dr. PQR",
    components: [
      { name: "Attendance", type: "attendance", weight: 5 },
      { name: "ICA 1 - Homework Series", type: "assignment", weight: 10 },
      { name: "ICA 2 - Midterm Theory", type: "exam", weight: 15 },
      { name: "ICA 3 - Forecasting Lab", type: "lab", weight: 10 },
      { name: "ICA 4 - Capstone Project", type: "project", weight: 10 },
      { name: "Term End Examination (TEE)", type: "exam", weight: 50 }
    ]
  },
  "CS402": {
    course_id: "CS402",
    course_name: "Cloud Computing Architecture",
    semester: 5,
    faculty: "Dr. K. Raman",
    components: [
      { name: "Attendance", type: "attendance", weight: 5 },
      { name: "ICA 1 - AWS Labs", type: "lab", weight: 10 },
      { name: "ICA 2 - Midterm Exam", type: "exam", weight: 15 },
      { name: "ICA 3 - Cloud Security Quiz", type: "quiz", weight: 10 },
      { name: "ICA 4 - Serverless Project", type: "project", weight: 10 },
      { name: "Term End Examination (TEE)", type: "exam", weight: 50 }
    ]
  }
};

export const studentCourseData: Record<string, CourseData> = {
  "ML101": {
    policy: coursePolicies["ML101"],
    attendance: { course_id: "ML101", student_id: "STU-2026-001", percentage: 88 },
    assessments: [
      { id: "a1", course_id: "ML101", student_id: "STU-2026-001", component_name: "Assignment 1 (ICA 1)", score: 18, max_score: 20 },
      { id: "m1", course_id: "ML101", student_id: "STU-2026-001", component_name: "Midterm Exam (ICA 2)", score: 42, max_score: 50 },
      { id: "l1", course_id: "ML101", student_id: "STU-2026-001", component_name: "Lab Practicals (ICA 3)", score: 9.5, max_score: 10 },
      { id: "p1", course_id: "ML101", student_id: "STU-2026-001", component_name: "Course Project (ICA 4)", score: 86, max_score: 100 }
    ]
  },
  "SE201": {
    policy: coursePolicies["SE201"],
    attendance: { course_id: "SE201", student_id: "STU-2026-001", percentage: 84 },
    assessments: [
      { id: "q1", course_id: "SE201", student_id: "STU-2026-001", component_name: "Quiz 1 (ICA 1)", score: 9, max_score: 10 },
      { id: "q2", course_id: "SE201", student_id: "STU-2026-001", component_name: "Quiz 2 (ICA 2)", score: 8.5, max_score: 10 },
      { id: "sl1", course_id: "SE201", student_id: "STU-2026-001", component_name: "Lab Submissions (ICA 3)", score: 17, max_score: 20 }
    ]
  },
  "TS301": {
    policy: coursePolicies["TS301"],
    attendance: { course_id: "TS301", student_id: "STU-2026-001", percentage: 92 },
    assessments: [
      { id: "as1", course_id: "TS301", student_id: "STU-2026-001", component_name: "ICA 1 - Homework Series", score: 9.5, max_score: 10 },
      { id: "m2", course_id: "TS301", student_id: "STU-2026-001", component_name: "ICA 2 - Midterm Theory", score: 26, max_score: 30 }
    ]
  },
  "CS402": {
    policy: coursePolicies["CS402"],
    attendance: { course_id: "CS402", student_id: "STU-2026-001", percentage: 94 },
    assessments: [
      { id: "cl1", course_id: "CS402", student_id: "STU-2026-001", component_name: "ICA 1 - AWS Labs", score: 19, max_score: 20 },
      { id: "cm1", course_id: "CS402", student_id: "STU-2026-001", component_name: "ICA 2 - Midterm Exam", score: 27, max_score: 30 }
    ]
  }
};
