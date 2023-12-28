import { AnimatePresence, motion, useAnimation } from "framer-motion";
import {
  useEffect,
  useRef,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

export const Leaflet = ({
  setShow,
  children,
  className,
}: {
  setShow: Dispatch<SetStateAction<boolean>>;
  children: ReactNode;
  className?: string;
}) => {
  const leafletRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const transitionProps = { type: "spring", stiffness: 500, damping: 30 };

  useEffect(() => {
    void controls.start({
      y: 20,
      transition: transitionProps,
    });
  }, []);

  const handleDragEnd = async (
    _: MouseEvent | TouchEvent,
    info: { offset: { y: number }; velocity: { y: number } }
  ) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    const height = leafletRef.current?.getBoundingClientRect().height ?? 0;
    if (offset > height / 2 || velocity > 800) {
      try {
        await controls.start({ y: "100%", transition: transitionProps });
        setShow(false);
      } catch (error) {
        console.error(error);
      }
    } else {
      controls
        .start({ y: 0, transition: transitionProps })
        .catch(console.error);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={leafletRef}
        key="leaflet"
        className="group fixed inset-x-0 bottom-0 z-40 w-screen cursor-grab rounded-xl border border-stroke bg-white pb-5 active:cursor-grabbing md:hidden "
        initial={{ y: "100%" }}
        animate={controls}
        exit={{ y: "100%" }}
        transition={transitionProps}
        drag="y"
        dragDirectionLock
        onDragEnd={handleDragEnd}
        dragElastic={{ top: 0, bottom: 1 }}
        dragConstraints={{ top: 0, bottom: 0 }}
      >
        <div
          className={`rounded-t-4xl -mb-1 flex h-7 w-full items-center justify-center`}
        >
          <div className="-mr-1 h-1 w-6 rounded-full bg-gray-300 transition-all" />
          {/* group-active:-rotate-12 */}
          <div className="h-1 w-6 rounded-full bg-gray-300 transition-all " />
        </div>
        <div className={`max-h-[325px] overflow-y-auto ${className ?? ""}`}>
          {children}
        </div>
      </motion.div>
      <motion.div
        key="leaflet-backdrop"
        className="fixed inset-0 z-30 bg-[#00000099] backdrop-blur md:hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => {
          setShow(false);
        }}
      />
    </AnimatePresence>
  );
};
