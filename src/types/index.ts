export interface ComponentPolicy {
  name: string;
  type: 'attendance' | 'assignment' | 'quiz' | 'exam' | 'project' | 'lab';
  weight: number;
  rules?: any;
}

export interface CoursePolicy {
  course_id: string;
  course_name: string;
  semester: number;
  faculty: string;
  components: ComponentPolicy[];
}

export interface Student {
  student_id: string;
  name: string;
  email: string;
  department: string;
  semester: number;
  profile_image?: string;
}

export interface AttendanceRecord {
  course_id: string;
  student_id: string;
  percentage: number;
}

export interface AssessmentRecord {
  id: string;
  course_id: string;
  student_id: string;
  component_name: string;
  score: number;
  max_score: number;
}

export interface CourseData {
  policy: CoursePolicy;
  attendance: AttendanceRecord;
  assessments: AssessmentRecord[];
}
