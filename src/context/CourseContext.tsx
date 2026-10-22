import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CourseData, CoursePolicy, AssessmentRecord } from '../types';
import { studentCourseData as initialMockCourses, mockStudent } from '../services/mockData';

export interface CourseContextType {
  coursesDict: Record<string, CourseData>;
  courses: CourseData[];
  getCourse: (courseId: string) => CourseData | undefined;
  setComponentMarks: (courseId: string, componentName: string, score: number, maxScore: number) => void;
  updateAssessmentMarks: (courseId: string, assessmentId: string, score: number, maxScore: number) => void;
  updateAttendance: (courseId: string, percentage: number) => void;
  clearComponentMarks: (courseId: string, componentName: string) => void;
  addAssessment: (courseId: string, componentName: string, score: number, maxScore: number) => void;
  deleteAssessment: (courseId: string, assessmentId: string) => void;
  addCoursePolicy: (policy: CoursePolicy) => void;
  createCourse: (courseData: CourseData) => void;
  removeCourse: (courseId: string) => void;
  resetToDefaults: () => void;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

const STORAGE_KEY = 'portal_engine_courses_data_v3';

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coursesDict, setCoursesDict] = useState<Record<string, CourseData>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          // Sync with mockData in-memory
          Object.assign(initialMockCourses, parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading course data from storage', e);
    }
    return JSON.parse(JSON.stringify(initialMockCourses));
  });

  // Keep storage and in-memory mockData synchronized
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coursesDict));
      Object.assign(initialMockCourses, coursesDict);
    } catch (e) {
      console.error('Failed to save course data', e);
    }
  }, [coursesDict]);

  const getCourse = useCallback((courseId: string): CourseData | undefined => {
    return coursesDict[courseId];
  }, [coursesDict]);

  const setComponentMarks = useCallback((
    courseId: string,
    componentName: string,
    score: number,
    maxScore: number
  ) => {
    setCoursesDict(prev => {
      const course = prev[courseId];
      if (!course) return prev;

      const safeMax = maxScore > 0 ? maxScore : 100;
      const safeScore = Math.max(0, score);

      const existingAssessments = [...course.assessments];
      const matchIndex = existingAssessments.findIndex(a => a.component_name === componentName);

      let updatedAssessments: AssessmentRecord[];
      if (matchIndex !== -1) {
        updatedAssessments = existingAssessments.map((a, idx) =>
          idx === matchIndex ? { ...a, score: safeScore, max_score: safeMax } : a
        );
      } else {
        const newRecord: AssessmentRecord = {
          id: `${courseId.toLowerCase()}_${componentName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`,
          course_id: courseId,
          student_id: course.attendance?.student_id || mockStudent.student_id,
          component_name: componentName,
          score: safeScore,
          max_score: safeMax
        };
        updatedAssessments = [...existingAssessments, newRecord];
      }

      return {
        ...prev,
        [courseId]: {
          ...course,
          assessments: updatedAssessments
        }
      };
    });
  }, []);

  const updateAssessmentMarks = useCallback((
    courseId: string,
    assessmentId: string,
    score: number,
    maxScore: number
  ) => {
    setCoursesDict(prev => {
      const course = prev[courseId];
      if (!course) return prev;

      const safeMax = maxScore > 0 ? maxScore : 100;
      const safeScore = Math.max(0, score);

      return {
        ...prev,
        [courseId]: {
          ...course,
          assessments: course.assessments.map(a =>
            a.id === assessmentId ? { ...a, score: safeScore, max_score: safeMax } : a
          )
        }
      };
    });
  }, []);

  const updateAttendance = useCallback((courseId: string, percentage: number) => {
    setCoursesDict(prev => {
      const course = prev[courseId];
      if (!course) return prev;

      const clamped = Math.min(100, Math.max(0, Math.round(percentage * 10) / 10));
      return {
        ...prev,
        [courseId]: {
          ...course,
          attendance: {
            ...course.attendance,
            percentage: clamped
          }
        }
      };
    });
  }, []);

  const clearComponentMarks = useCallback((courseId: string, componentName: string) => {
    setCoursesDict(prev => {
      const course = prev[courseId];
      if (!course) return prev;

      return {
        ...prev,
        [courseId]: {
          ...course,
          assessments: course.assessments.filter(a => a.component_name !== componentName)
        }
      };
    });
  }, []);

  const addAssessment = useCallback((
    courseId: string,
    componentName: string,
    score: number,
    maxScore: number
  ) => {
    setCoursesDict(prev => {
      const course = prev[courseId];
      if (!course) return prev;

      const newRecord: AssessmentRecord = {
        id: `${courseId.toLowerCase()}_${componentName.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`,
        course_id: courseId,
        student_id: course.attendance?.student_id || mockStudent.student_id,
        component_name: componentName,
        score: Math.max(0, score),
        max_score: maxScore > 0 ? maxScore : 100
      };

      return {
        ...prev,
        [courseId]: {
          ...course,
          assessments: [...course.assessments, newRecord]
        }
      };
    });
  }, []);

  const deleteAssessment = useCallback((courseId: string, assessmentId: string) => {
    setCoursesDict(prev => {
      const course = prev[courseId];
      if (!course) return prev;

      return {
        ...prev,
        [courseId]: {
          ...course,
          assessments: course.assessments.filter(a => a.id !== assessmentId)
        }
      };
    });
  }, []);

  const addCoursePolicy = useCallback((policy: CoursePolicy) => {
    if (!policy.course_id || !policy.course_name) return;

    setCoursesDict(prev => {
      const newCourse: CourseData = {
        policy,
        attendance: { course_id: policy.course_id, student_id: mockStudent.student_id, percentage: 100 },
        assessments: []
      };

      return {
        ...prev,
        [policy.course_id]: newCourse
      };
    });
  }, []);

  const createCourse = useCallback((courseData: CourseData) => {
    if (!courseData.policy.course_id) return;
    setCoursesDict(prev => ({
      ...prev,
      [courseData.policy.course_id]: courseData
    }));
  }, []);

  const removeCourse = useCallback((courseId: string) => {
    setCoursesDict(prev => {
      const copy = { ...prev };
      delete copy[courseId];
      return copy;
    });
    // Clean up targets from localStorage if existing
    try {
      const savedTargets = localStorage.getItem('portal_engine_desired_grades_targets');
      if (savedTargets) {
        const parsed = JSON.parse(savedTargets);
        delete parsed[courseId];
        localStorage.setItem('portal_engine_desired_grades_targets', JSON.stringify(parsed));
      }
    } catch {
      // ignore
    }
  }, []);

  const resetToDefaults = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    const fresh = JSON.parse(JSON.stringify(initialMockCourses));
    setCoursesDict(fresh);
  }, []);

  return (
    <CourseContext.Provider
      value={{
        coursesDict,
        courses: Object.values(coursesDict),
        getCourse,
        setComponentMarks,
        updateAssessmentMarks,
        updateAttendance,
        clearComponentMarks,
        addAssessment,
        deleteAssessment,
        addCoursePolicy,
        createCourse,
        removeCourse,
        resetToDefaults
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourses = (): CourseContextType => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourses must be used within a CourseProvider');
  }
  return context;
};

