import React, { Fragment } from "react";

const Skeleton = () => {
  return (
    <Fragment>
      <div className="w-full h-5 bg-gray-200 rounded animate-pulse"></div>
    </Fragment>
  );
};

export default Skeleton;
