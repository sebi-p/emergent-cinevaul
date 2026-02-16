import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUsers, createUser as apiCreateUser, deleteUser as apiDeleteUser } from '../lib/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await getUsers();
      setUsers(data);
      
      // Restore last selected user from localStorage
      const savedUserId = localStorage.getItem('cinevault_user_id');
      if (savedUserId) {
        const savedUser = data.find(u => u.id === savedUserId);
        if (savedUser) {
          setCurrentUser(savedUser);
        }
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const selectUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('cinevault_user_id', user.id);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('cinevault_user_id');
  };

  const createUser = async (userData) => {
    const newUser = await apiCreateUser(userData);
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const removeUser = async (userId) => {
    await apiDeleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) {
      logout();
    }
  };

  return (
    <UserContext.Provider value={{
      users,
      currentUser,
      loading,
      selectUser,
      logout,
      createUser,
      removeUser,
      refreshUsers: fetchUsers,
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
