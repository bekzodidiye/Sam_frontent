import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8003/api/v1/';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('paynet_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (data: any) => api.post('auth/login/', data),
  register: (data: any) => api.post('auth/register/', data),
  getMe: () => api.get('users/me/'),
};

export const userService = {
  getUsers: () => api.get('users/'),
  getApprovals: () => api.get('users/approvals/'),
  approveUser: (id: string) => api.post(`users/${id}/approve/`),
  updateUser: async (id: string, data: any) => {
    const photoData = data.photo || data.avatar;
    if (photoData && photoData.startsWith('data:')) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'photo' && key !== 'avatar' && data[key] !== undefined && data[key] !== null) {
          if (typeof data[key] === 'object') {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, String(data[key]));
          }
        }
      });

      const res = await fetch(photoData);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      formData.append('photo', blob, `avatar.${ext}`);

      return api.patch(`users/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }

    // JSON payload
    const payload = { ...data };
    if (payload.photo && payload.photo.startsWith('http')) delete payload.photo;
    if (payload.avatar && payload.avatar.startsWith('http')) delete payload.avatar;

    return api.patch(`users/${id}/`, payload);
  },
  deleteUser: (id: string) => api.delete(`users/${id}/`),
};

export const checkInService = {
  getCheckIns: () => api.get('checkins/'),
  createCheckIn: (data: any) => api.post('checkins/', data),
  updateCheckIn: (id: string, data: any) => api.patch(`checkins/${id}/`, data),

  /**
   * Creates a CheckIn with a photo using multipart/form-data.
   * The backend photo field is an ImageField, so it must be a real file.
   * @param locationLat - Latitude
   * @param locationLng - Longitude
   * @param photoBase64 - Base64 data URL (e.g. "data:image/jpeg;base64,...")
   */
  createCheckInWithPhoto: async (locationLat: number, locationLng: number, photoBase64: string | null) => {
    const formData = new FormData();
    formData.append('location_lat', String(locationLat));
    formData.append('location_lng', String(locationLng));

    if (photoBase64) {
      const res = await fetch(photoBase64);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      formData.append('photo', blob, `checkin_photo.${ext}`);
    }

    return api.post('checkins/', formData);
  },
};


export const saleService = {
  getSales: () => api.get('sales/'),
  createSale: (data: any) => api.post('sales/', data),
  updateSale: (id: string, data: any) => api.patch(`sales/${id}/`, data),
  deleteSale: (id: string) => api.delete(`sales/${id}/`),
  createReport: (data: any) => api.post('reports/', data),
};

export const messageService = {
  getMessages: () => api.get('messages/'),
  sendMessage: (data: any) => api.post('messages/', data),
  markAsRead: (id: string) => api.post(`messages/${id}/read/`),
};

export const ruleService = {
  getRules: () => api.get('rules/'),
  getTariffs: () => api.get('tariffs/'),
  createRule: (data: any) => api.post('rules/', data),
  updateRule: (id: string, data: any) => api.patch(`rules/${id}/`, data),
  deleteRule: (id: string) => api.delete(`rules/${id}/`),
  addTariff: (data: any) => api.post('tariffs/', data),
  removeTariff: (data: any) => api.post('tariffs/remove/', data),
};

export const targetService = {
  getTargets: () => api.get('targets/'),
  setTarget: (data: any) => api.post('targets/', data),
};

export const reportService = {
  getReports: () => api.get('reports/'),
  createReport: (data: any) => api.post('reports/', data),
};

export const linkService = {
  getSalesLinks: () => api.get('sales_links/'),
  createSalesLink: async (data: any) => {
    if (data.image && data.image.startsWith('data:')) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('url', data.url);
      if (data.mobileUrl) formData.append('mobileUrl', data.mobileUrl);

      const res = await fetch(data.image);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      formData.append('image', blob, `link_image.${ext}`);

      return api.post('sales_links/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }

    // Fallback to JSON if no image
    return api.post('sales_links/', {
      name: data.name,
      url: data.url,
      mobileUrl: data.mobileUrl,
    });
  },
  updateSalesLink: async (id: string, data: any) => {
    if (data.image && data.image.startsWith('data:')) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('url', data.url);
      if (data.mobileUrl) formData.append('mobileUrl', data.mobileUrl);

      const res = await fetch(data.image);
      const blob = await res.blob();
      const ext = blob.type.split('/')[1] || 'jpg';
      formData.append('image', blob, `link_image.${ext}`);

      return api.patch(`sales_links/${id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }

    // JSON payload
    return api.patch(`sales_links/${id}/`, {
      name: data.name,
      url: data.url,
      mobileUrl: data.mobileUrl,
      ...(data.image === '' ? { image: null } : {})
    });
  },
  deleteSalesLink: (id: string) => api.delete(`sales_links/${id}/`),
};

export const operatorRatingService = {
  getRatings: () => api.get('operator_ratings/'),
  submitRating: (data: { operator_id: string; date: string; stars: number; comment: string }) =>
    api.post('operator_ratings/', data),
};

export const settingsService = {
  getSettings: () => api.get('settings/'),
  updateSettings: (data: any) => api.post('settings/', data),
};

export default api;
