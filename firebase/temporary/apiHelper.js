// apiHelper.js
import axios from 'axios';

// ✅ Base URL for your API
const BASE_URL = 'https://example.com/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ GET Request
export const getData = async (endpoint, params = {}) => {
  try {
    const response = await apiClient.get(endpoint, { params });
    return response.data;
  } catch (error) {
    console.error('GET error:', error.message);
    throw error;
  }
};

// ✅ POST Request
export const postData = async (endpoint, data = {}) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error('POST error:', error.message);
    throw error;
  }
};

// ✅ PUT Request
export const putData = async (endpoint, data = {}) => {
  try {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error('PUT error:', error.message);
    throw error;
  }
};

// ✅ DELETE Request
export const deleteData = async endpoint => {
  try {
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error('DELETE error:', error.message);
    throw error;
  }
};

