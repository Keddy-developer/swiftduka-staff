import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../services/axiosConfig';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('staff_token');
    const stored = localStorage.getItem('staff_user');
    if (token && stored) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          setUser(JSON.parse(stored));
        } else {
          localStorage.removeItem('staff_token');
          localStorage.removeItem('staff_user');
        }
      } catch {
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const { data } = await axiosInstance.post('/auth/login', { email, password, portal: 'staff' });
    const { token, user: userData } = data;
    localStorage.setItem('staff_token', token);
    localStorage.setItem('staff_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_user');
    setUser(null);
  };

  const forgotPassword = async (email) => {
    return await axiosInstance.post('/auth/forgot-password', { identifier: email, portal: 'staff' });
  };

  // Role helpers
  const isAdmin = user?.role?.includes('admin') || user?.role?.includes('super_admin');
  const isManager = user?.role?.includes('fulfillment_manager');
  const isHQ = user?.role?.includes('hq_staff');
  const isRider = user?.role?.includes('rider');
  const isAgent = user?.role?.includes('pickup_agent');
  const isStaff = user?.role?.includes('fulfillment_staff');

  const canManagePayroll = isAdmin || isHQ;
  const canViewOwnCenter = isManager || isAdmin || isHQ;

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout, forgotPassword,
      isAdmin, isManager, isHQ, isRider, isAgent, isStaff,
      canManagePayroll, canViewOwnCenter,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
