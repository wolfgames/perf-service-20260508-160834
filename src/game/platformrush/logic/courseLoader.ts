/**
 * Course loader — dispatches to fixture or procedural generator.
 *
 * Rules:
 *   courseIndex 0 or 1 → hand-crafted fixture (always synchronous)
 *   courseIndex 2+      → procedural (levelGenerator)
 *   useFallback: true   → always return fallback fixture
 *
 * No Math.random. Pure synchronous logic.
 */
import type { CourseData } from '~/game/platformrush/logic/solvabilityValidator';
import { generateLevel } from '~/game/platformrush/logic/levelGenerator';

import course0 from '~/game/platformrush/data/courses/district-0/course-0.json';
import course1 from '~/game/platformrush/data/courses/district-0/course-1.json';
import fallback0 from '~/game/platformrush/data/courses/district-0/fallback.json';

type FixtureJson = {
  source: string;
  platforms: Array<{ x: number; y: number; width: number; type: string }>;
  tokens?: Array<{ x: number; y: number }>;
  obstacles?: Array<{ x: number; y: number; kind?: string }>;
  finishFlagX?: number;
};

const castFixture = (json: FixtureJson): CourseData => ({
  source: json.source,
  platforms: json.platforms.map(p => ({
    ...p,
    type: p.type as CourseData['platforms'][number]['type'],
  })),
  tokens: json.tokens,
  obstacles: json.obstacles?.map(o => ({ x: o.x, y: o.y, kind: o.kind ?? 'crate' })),
  finishFlagX: json.finishFlagX,
});

const districtFixtures: Record<number, { course0: CourseData; course1: CourseData; fallback: CourseData }> = {
  0: {
    course0: castFixture(course0 as unknown as FixtureJson),
    course1: castFixture(course1 as unknown as FixtureJson),
    fallback: castFixture(fallback0 as unknown as FixtureJson),
  },
};

export interface LoadCourseOptions {
  districtIndex: number;
  courseIndex: number;
  useFallback?: boolean;
}

export const loadFallbackFixture = (districtIndex: number): CourseData => {
  const fixtures = districtFixtures[districtIndex] ?? districtFixtures[0];
  return fixtures!.fallback;
};

export const loadCourse = ({ districtIndex, courseIndex, useFallback }: LoadCourseOptions): CourseData => {
  if (useFallback) return loadFallbackFixture(districtIndex);

  const fixtures = districtFixtures[districtIndex];

  // Hand-crafted fixtures for courses 0 and 1
  if (fixtures && courseIndex === 0) return fixtures.course0;
  if (fixtures && courseIndex === 1) return fixtures.course1;

  // Procedural generation for courseIndex 2+
  return generateLevel({ districtIndex, courseIndex });
};
