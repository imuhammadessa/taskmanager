import { Outlet } from "react-router-dom";

const PrivateRoute = ({ allowedRoles }) => {
  return <Outlet allowedRoles={allowedRoles} />;
};

export default PrivateRoute;
