/**
 * courseLoader — fixture loading
 *
 * Tests that hand-crafted fixtures load for district-0 courses.
 */
import { describe, it, expect } from 'vitest';
import { loadCourse } from '~/game/platformrush/logic/courseLoader';
import { validateSolvability } from '~/game/platformrush/logic/solvabilityValidator';

describe('courseLoader — fixture loading', () => {
  it('district=0 course=0 loads hand-crafted fixture', () => {
    const course = loadCourse({ districtIndex: 0, courseIndex: 0 });
    expect(course.source).toBe('fixture');
    expect(course.platforms.length).toBeGreaterThan(0);
  });

  it('district=0 course=1 loads hand-crafted fixture', () => {
    const course = loadCourse({ districtIndex: 0, courseIndex: 1 });
    expect(course.source).toBe('fixture');
    expect(course.platforms.length).toBeGreaterThan(0);
  });

  it('fixture pool >= 3 files for district-0', () => {
    // course-0, course-1, and fallback
    const c0 = loadCourse({ districtIndex: 0, courseIndex: 0 });
    const c1 = loadCourse({ districtIndex: 0, courseIndex: 1 });
    const fallback = loadCourse({ districtIndex: 0, courseIndex: 99, useFallback: true });

    expect(c0).toBeDefined();
    expect(c1).toBeDefined();
    expect(fallback).toBeDefined();
    expect(fallback.source).toBe('fixture');
  });

  it('procedural course loads for district=0 course=2', () => {
    const course = loadCourse({ districtIndex: 0, courseIndex: 2 });
    expect(course.source).toBe('procedural');
    expect(course.platforms.length).toBeGreaterThan(0);
  });

  it('all district-0 fixtures pass solvability', () => {
    const c0 = loadCourse({ districtIndex: 0, courseIndex: 0 });
    const c1 = loadCourse({ districtIndex: 0, courseIndex: 1 });
    const fallback = loadCourse({ districtIndex: 0, courseIndex: 99, useFallback: true });

    expect(validateSolvability(c0).valid).toBe(true);
    expect(validateSolvability(c1).valid).toBe(true);
    expect(validateSolvability(fallback).valid).toBe(true);
  });
});
