"use client";

import { type CourseType, type EntityType } from "@golf-district/shared";
import type { Path } from "~/hooks/usePreviousPath";
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
  prevPath: Path | null;
  entity: EntityType | undefined;
  courses: CourseType[] | undefined;
  setPrevPath: Dispatch<SetStateAction<Path | null>>;
  alertOffersShown: boolean;
  setAlertOffersShown: Dispatch<SetStateAction<boolean>>;
  setIsNavExpanded: Dispatch<SetStateAction<boolean>>;
  isNavExpanded:boolean
}

const AppContext = createContext<AppContextType>({
  prevPath: null,
  entity: undefined,
  courses: undefined,
  setPrevPath: () => undefined,
  alertOffersShown: false,
  setAlertOffersShown: () => ({}),
  isNavExpanded : false,
  setIsNavExpanded:() => ({})
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
  const [isNavExpanded, setIsNavExpanded] = useState(false);
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
    isNavExpanded,
    setIsNavExpanded
  };

  return <AppContext.Provider value={settings}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  return useContext(AppContext);
};
