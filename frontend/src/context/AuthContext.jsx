import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load token and user from localStorage on initial load
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            setLoading(false);
        } else if (sessionStorage.getItem('loggedOut') === 'true') {
            setLoading(false);
        } else {
            // Auto login as admin if no user is authenticated
            const performAutoLogin = async () => {
                try {
                    const response = await axios.post('/api/auth/login', {
                        username: 'admin',
                        password: 'admin'
                    });
                    const { token: newToken, user: newUser } = response.data;
                    localStorage.setItem('token', newToken);
                    localStorage.setItem('user', JSON.stringify(newUser));
                    setToken(newToken);
                    setUser(newUser);
                } catch (error) {
                    console.error('Error auto-logging in:', error);
                } finally {
                    setLoading(false);
                }
            };
            performAutoLogin();
        }
    }, []);

    const login = (newToken, newUser) => {
        sessionStorage.removeItem('loggedOut');
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        sessionStorage.setItem('loggedOut', 'true');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
