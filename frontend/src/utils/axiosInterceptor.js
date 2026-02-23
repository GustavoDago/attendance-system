import axios from 'axios';

const setupAxiosInterceptors = () => {
    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    axios.interceptors.response.use(
        (response) => {
            return response;
        },
        (error) => {
            if (error.response?.status === 401) {
                // Handle unauthorized errors globally (e.g. redirect to login)
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Could refresh page if needed, but Context usually handles state
                window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};

export default setupAxiosInterceptors;
