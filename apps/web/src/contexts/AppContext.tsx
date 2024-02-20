"use client";

import { type CourseType, type EntityType } from "@golf-district/shared";
import { usePreviousPath } from "~/hooks/usePreviousPath";
import { api } from "~/utils/api";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface AppContextType {
  prevPath: string | null;
  entity: EntityType | undefined;
  courses: CourseType[] | undefined;
  setPrevPath: Dispatch<SetStateAction<string | null>>;
  alertOffersShown: boolean;
  setAlertOffersShown: Dispatch<SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType>({
  prevPath: null,
  entity: undefined,
  courses: undefined,
  setPrevPath: () => undefined,
  alertOffersShown: false,
  setAlertOffersShown: () => ({}),
});

export const AppWrapper = ({
  children,
  entityData,
}: {
  children: ReactNode;
  entityData: EntityType | undefined;
}) => {
  const { prevPath, setPrevPath } = usePreviousPath();
  const [entity, setEntity] = useState<EntityType | undefined>(entityData);

  useEffect(() => {
    if (entityData) {
      setEntity(entityData);
      const html = document.querySelector("html");
      if (html) {
        html.style.setProperty(
          "--primary-color",
          entityData.color1 ?? "#007AFF"
        );
      }
    }
  }, [entityData]);

  const entityId = entity?.id;

  const { data: courses } = api.entity.getCoursesByEntityId.useQuery(
    { entityId: entityId! },
    { enabled: entityId !== undefined }
  );
  const [alertOffersShown, setAlertOffersShown] = useState<boolean>(false);
  const settings = {
    prevPath,
    entity,
    courses,
    setPrevPath,
    alertOffersShown,
    setAlertOffersShown,
  };

  return <AppContext.Provider value={settings}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
