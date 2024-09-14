import type { entities } from "@golf-district/database/schema/entities";

export const mockEntities: (typeof entities.$inferInsert)[] = [
  {
    id: "entity1",
    requiredTimeBeforeTeeTime: 1000,
    name: "Entity One Name",
    description: "Entity One Description",
    logo: "Entity One Logo",
    font: "font-cal",
    color1: "ff0000",
    color2: "00ff00",
    color3: "0000ff",
    subdomain: "subdomain.entity1.com",
    customDomain: "entity1.com",
    message404: "Entity One 404 Message",
    createdAt: new Date(new Date().getTime() - 1000).toISOString().replace("T", " ").replace("Z", ""),
    updatedAt: new Date(new Date().getTime() + 1000).toISOString().replace("T", " ").replace("Z", ""),
    updatedById: "user1",
  },
];
