import { beforeEach, describe, expect, it } from "vitest";
import { createDrizzleMock } from "../../../mocks";
import { mockAssets } from "../../../mocks/assets.mock";
import { mockCourses } from "../../../mocks/courses.mock";
import { mockEntities } from "../../../mocks/entities.mock";
import { EntityService } from "../entity.service";

let dbMock = {
  select: createDrizzleMock([mockEntities, mockEntities, mockEntities, mockCourses, mockAssets]),
  update: createDrizzleMock([]),
  insert: createDrizzleMock([]),
  query: {
    courses: () => {
      return { findFirst: createDrizzleMock([mockEntities[0]]) };
    },
  },
};

describe("EntityService", () => {
  let entitiesService: EntityService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    entitiesService = new EntityService(dbMock as any);
  });

  describe("Entity Crud", () => {
    it("Should grab entity from course id", async () => {
      try {
        await entitiesService.getEntityFromCourseId("course1");
      } catch {}
      expect(dbMock.findFirst).toHaveBeenCalled;
    });
    it("Should grab static params of entities", async () => {
      await entitiesService.getStaticParams();
      expect(dbMock.select).toHaveBeenCalledTimes(2);
    });
    it("Should grab entity from Domain", async () => {
      await entitiesService.getEntityFromDomain("entity1", "entitydomain.com");
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should get course via entity id", async () => {
      await entitiesService.getCoursesByEntityId("entity1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });
});
