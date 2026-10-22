
import { apiRequest } from "./api";
import type { CourseData } from "../types";

export interface StoredCourse extends CourseData {
    userId: string;
    courseId: string;
    createdAt: string;
    updatedAt: string;
}

export async function getCourses(): Promise<StoredCourse[]> {
    const result = await apiRequest<{ courses: StoredCourse[] }>(
        "/courses"
    );

    return result.courses;
}

export async function createCourse(
    course: CourseData
): Promise<StoredCourse> {
    const result = await apiRequest<{ course: StoredCourse }>(
        "/courses",
        {
            method: "POST",
            body: JSON.stringify(course),
        }
    );

    return result.course;
}

export async function updateCourse(
    courseId: string,
    updates: Partial<CourseData>
): Promise<StoredCourse> {
    const result = await apiRequest<{ course: StoredCourse }>(
        `/courses/${encodeURIComponent(courseId)}`,
        {
            method: "PUT",
            body: JSON.stringify(updates),
        }
    );

    return result.course;
}

export async function deleteCourse(
    courseId: string
): Promise<void> {
    await apiRequest<{ message: string }>(
        `/courses/${encodeURIComponent(courseId)}`,
        {
            method: "DELETE",
        }
    );
}
