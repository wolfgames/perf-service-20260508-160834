/**
 * progressionStore — in-memory district/course unlock state.
 *
 * Source of truth for which courses are locked/unlocked/complete.
 * Uses SolidJS createStore for reactive DOM binding.
 * Resets on page reload by design (persistence is meta-pass concern).
 *
 * Initial state: only district-0/course-0 is unlocked.
 */
import { createStore } from 'solid-js/store';

export type NodeStatus = 'locked' | 'unlocked' | 'complete';

export interface CourseNode {
  status: NodeStatus;
  stars: number;
}

export interface ProgressionStore {
  districts: CourseNode[][];
  markComplete: (districtIndex: number, courseIndex: number, stars: number) => void;
  setUnlocked: (districtIndex: number, courseIndex: number) => void;
}

const DISTRICT_COUNT = 3;
const COURSE_COUNT = 8;

const makeLockedNode = (): CourseNode => ({ status: 'locked', stars: 0 });

const initDistricts = (): CourseNode[][] => {
  const districts: CourseNode[][] = Array.from({ length: DISTRICT_COUNT }, () =>
    Array.from({ length: COURSE_COUNT }, makeLockedNode),
  );
  // Only district-0/course-0 starts unlocked
  districts[0][0] = { status: 'unlocked', stars: 0 };
  return districts;
};

export const createProgressionStore = (): ProgressionStore => {
  const [districts, setDistricts] = createStore<CourseNode[][]>(initDistricts());

  const setUnlocked = (districtIndex: number, courseIndex: number) => {
    const node = districts[districtIndex]?.[courseIndex];
    if (node?.status === 'locked') {
      setDistricts(districtIndex, courseIndex, { status: 'unlocked', stars: 0 });
    }
  };

  const markComplete = (districtIndex: number, courseIndex: number, stars: number) => {
    setDistricts(districtIndex, courseIndex, { status: 'complete', stars });

    // Unlock the next course in district
    const nextCourseIndex = courseIndex + 1;
    if (nextCourseIndex < COURSE_COUNT) {
      setUnlocked(districtIndex, nextCourseIndex);
    }
  };

  return { districts, markComplete, setUnlocked };
};

/** Check if a course can be started (status is 'unlocked' or 'complete') */
export const canStartCourse = (
  store: ProgressionStore,
  districtIndex: number,
  courseIndex: number,
): boolean => {
  const node = store.districts[districtIndex]?.[courseIndex];
  return node?.status === 'unlocked' || node?.status === 'complete';
};

/** Get the node state for a district/course */
export const getNodeState = (
  store: ProgressionStore,
  districtIndex: number,
  courseIndex: number,
): CourseNode => {
  return store.districts[districtIndex]?.[courseIndex] ?? makeLockedNode();
};

/** Explicitly unlock a course (used by district-complete unlock flow) */
export const unlockCourse = (
  store: ProgressionStore,
  districtIndex: number,
  courseIndex: number,
): void => {
  store.setUnlocked(districtIndex, courseIndex);
};

/** Check if all 8 courses in a district are complete */
export const isDistrictComplete = (store: ProgressionStore, districtIndex: number): boolean => {
  const courses = store.districts[districtIndex];
  if (!courses) return false;
  return courses.every((node) => node.status === 'complete');
};

/** Unlock the first course of the next district */
export const unlockNextDistrict = (store: ProgressionStore, districtIndex: number): void => {
  const nextDistrictIndex = districtIndex + 1;
  if (nextDistrictIndex < store.districts.length) {
    store.setUnlocked(nextDistrictIndex, 0);
  }
};
