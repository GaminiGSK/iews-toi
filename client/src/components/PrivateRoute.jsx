import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />; // Or unauthorized page
    }

    // Check for mandatory password change (unless we are on the change-password page, but that logic is better handled in App or Redirects)
    // Actually, let's enforce it here if we want, or just let App handle it.
    // If user.isFirstLogin is true, they should be redirected to change-password, unless they are already there.
    // We'll handle that in the pages or a layout wrapper.

    return <Outlet />;
};

export default PrivateRoute;
