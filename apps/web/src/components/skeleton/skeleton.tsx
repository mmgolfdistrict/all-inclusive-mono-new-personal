import React, { Fragment } from "react";

const Skeleton = () => {
  return (
    <Fragment>
      <div className="w-[25%] h-6 bg-gray-200 rounded animate-pulse"></div>
    </Fragment>
  );
};

export default Skeleton;
