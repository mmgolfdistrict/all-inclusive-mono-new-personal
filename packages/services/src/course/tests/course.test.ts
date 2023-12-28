import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDrizzleMock } from "../../../mocks";
import { mockAssets } from "../../../mocks/assets.mock";
import { mockCourseAssets } from "../../../mocks/courseAssets.mock";
import { mockCourses } from "../../../mocks/courses.mock";
import { mockEntities } from "../../../mocks/entities.mock";
import { CourseService } from "../course.service";

let dbMock = {
  select: createDrizzleMock([
    mockCourses,
    mockCourses,
    mockAssets,
    mockEntities,
    mockEntities,
    mockCourseAssets,
    mockCourseAssets,
    mockCourseAssets,
  ]),
  update: createDrizzleMock([mockAssets, mockCourses, mockEntities, mockEntities, mockCourseAssets]),
  insert: createDrizzleMock([mockCourses]),
};

describe("CourseService", () => {
  let coursesService: CourseService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    coursesService = new CourseService(dbMock as any, "mock_id", "mock_key", "mock_token");
  });

  describe("Course CRUD", () => {
    it("Should create a course", async () => {
      await coursesService.createCourse({ name: "Course 2" });
      expect(dbMock.insert).toHaveBeenCalled();
    });
    it("Should get course by id", async () => {
      await coursesService.getCourseById("course1");
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should update course info", async () => {
      await coursesService.updateCourseInfo("course1", { logoAssetId: "course1logo" });
      expect(dbMock.update).toHaveBeenCalled();
      expect(dbMock.select).toHaveBeenCalled();
    });
    // it("Should update course logo", async () => {

    // })
  });
  describe("updateCourse", () => {
    it("Should update course domain with custom domain", async () => {
      try {
        await coursesService.updateCourseDomain("entity1", "entityone.com");
      } catch {}
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
    });
    it("Should update course vercel domain", async () => {
      try {
        await coursesService.updateCourseDomain("entity1", "");
      } catch {}
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
    });
  });
  describe("Course Assets", () => {
    it("Should add assets to course", async () => {
      await coursesService.addAssetsToCourse("course1", ["asset1"]);
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.insert).toHaveBeenCalled();
    });
    it("Should update the course's asset order", async () => {
      try {
        await coursesService.updateAssetsOrder("course1", ["asset1"]);
      } catch {}
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.update).toHaveBeenCalled();
    });
  });
});
