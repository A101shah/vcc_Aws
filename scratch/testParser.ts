import { parseDocumentToCoursePolicy } from '../src/utils/pdfParser.ts';

const sampleText = `
Apex Institute of Technology
Department of Computer Engineering
Course Code: CS305
Course Title: Computer Communication Networks
Semester: V
Faculty: Prof. R. Sharma

4. Assessment and Evaluation Scheme

Internal Continuous Assessment (ICA) (50 Marks)
Class Tests (20 Marks) Term-work (30 Marks)
Assessment Component Class Test-1 Class Test-2 Lab Submissions /Practicals Class Participation Mini Project Lab Exam
Marks 10 10 10 5 5 10

Term End Examination (TEE): 50 Marks
`;

const rawStrings = [
  "Apex", "Institute", "of", "Technology",
  "Course", "Code:", "CS305",
  "Course", "Title:", "Computer Communication Networks",
  "Semester:", "V",
  "Faculty:", "Prof. R. Sharma",
  "4.", "Assessment", "and", "Evaluation", "Scheme",
  "Internal Continuous Assessment (ICA) (50 Marks)",
  "Class Tests (20 Marks)", "Term-work (30 Marks)",
  "Assessment", "Component",
  "Class Test-1", "Class Test-2", "Lab Submissions /Practicals", "Class Participation", "Mini Project", "Lab Exam",
  "Marks", "10", "10", "10", "5", "5", "10",
  "Term End Examination (TEE): 50 Marks"
];

const result = parseDocumentToCoursePolicy(sampleText, 'CS305_Policy.pdf', rawStrings, []);

console.log('=== PARSED POLICY RESULT ===');
console.log('Course ID:', result.policy.course_id);
console.log('Course Name:', result.policy.course_name);
console.log('Semester:', result.policy.semester);
console.log('Faculty:', result.policy.faculty);
console.log('Scheme Title:', result.schemeTitle);
console.log('ICA Subtotal:', result.icaSubtotal);
console.log('TEE Subtotal:', result.teeSubtotal);
console.log('\n=== EXTRACTED COMPONENTS ===');
result.policy.components.forEach((c, idx) => {
  console.log(`${idx + 1}. [${c.type.toUpperCase()}] ${c.name}: ${c.weight} Marks`);
});

const totalMarks = result.policy.components.reduce((sum, c) => sum + c.weight, 0);
console.log('\nTotal Availability:', totalMarks, 'Marks');

if (
  result.policy.course_id === 'CS305' &&
  result.policy.course_name === 'Computer Communication Networks' &&
  result.icaSubtotal === 50 &&
  result.teeSubtotal === 50 &&
  totalMarks === 100 &&
  result.policy.components.length === 7
) {
  console.log('\n✅ TEST PASSED: All requirements verified successfully!');
} else {
  console.error('\n❌ TEST FAILED: Verification failed');
  process.exit(1);
}
