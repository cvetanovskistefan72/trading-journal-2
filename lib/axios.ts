import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/",
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(
      error?.response?.data ?? { message: "Something went wrong" }
    );
  }
);

export default axiosInstance;
