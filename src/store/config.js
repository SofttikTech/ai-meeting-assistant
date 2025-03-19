const BASE_URL = 'https://database.softtik.com';

export const URL = 'https://server2.softtik.com';

// Generic API call helper
const apiCall = async (url, method = 'GET', data = null, extraOptions = {}) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...extraOptions.headers,
    },
    ...extraOptions,
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `Error ${response.status}`);
    }

    return responseData;
  } catch (error) {
    console.error(`Error calling ${url}:`, error);
    throw error;
  }
};

// 2. Create User
export const createUser = (payload) => apiCall(`${BASE_URL}/users`, 'POST', payload);

// 3. Get Advisor Clients
export const getAdvisorClients = async () => {
  try {
    const response = await fetch(`${BASE_URL}/advisor/clients`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Error fetching advisor clients");
    }
    return data;
  } catch (error) {
    console.error(`Error in getAdvisorClients:`, error);
    throw error;
  }
}

// 4. Get Previous Clients
export const getPreviousClients = async () => {
  try {
    const response = await fetch(`${BASE_URL}/advisor/clientsPrevious`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Error fetching advisor clients");
    }
    return data;
  } catch (error) {
    console.error(`Error in getPreviousClients:`, error);
    throw error;
  }
}

// 5. Get Meeting Count for Advisor
export const getMeetingCount = async (name) => {
  try {
    const response = await fetch(`${BASE_URL}/advisor/meetings/count/${name}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Error fetching meeting count");
    }
    return data;
  } catch (error) {
    console.error(`Error in getMeetingCount:`, error);
    throw error;
  }
}

// 7. Get Campaign
export const getCampaignD = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/campaign/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    const campaignData = await response.json();
    if (!response.ok) {
      throw new Error("Error retrieving campaign");
    }
    console.log(campaignData)
    return campaignData;
  } catch (error) {
    console.error("Error retrieving campaign:", error);
    throw error;
  }
};

export const getPreQ = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/getPreQ/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Failed to fetch pre meeting questions");
    }
    return data;
  } catch (error) {
    console.error("Error fetching pre meeting questions:", error);
    throw error;
  }
};

export const getSummary = async (id) => {
  try {
    const response = await fetch(`${BASE_URL}/getSummary/${id}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch summary");
    }
    return data;
  } catch (error) {
    console.error("Error fetching summary:", error);
    throw error;
  }
};

export const StorePreMeetingQuestions = async (userId, questions) => {
  try {
    const response = await fetch(`${BASE_URL}/clientRequests/${userId}/preMeetingQuestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preMeetingQuestions: questions })
    });
    const data = await response.json();
    if (response.ok) {
      console.log("Successfully stored pre meeting questions:", data);
    } else {
      console.error("Error storing pre meeting questions:", data.error);
    }
    return { storedData: data };
  } catch (error) {
    console.error("Error in storePreMeetingQuestions:", error);
    throw error;
  }
};

export const fetchPreMeetingQuestions = async (meetingId) => {
  try {
    const response = await fetch(`${BASE_URL}/preMeetingQuestions/${meetingId}`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error("Failed to fetch pre meeting questions");
    }
    return data;
  } catch (error) {
    console.error("Error in fetchPreMeetingQuestions:", error);
    throw error;
  }
};

// 10. Admin Login
export const adminLogin = async (credentials) => {
  try {
    const response = await fetch(`${BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error('Login failed');
    }
    return data;
  } catch (error) {
    console.error('Error during admin login:', error);
    throw error;
  }
};

// 11. Get All Advisors
export const getAllAdvisors = async () => {
  try {
    const response = await fetch(`${BASE_URL}/getAllAdvisors`);
    const data = await response.json();
    const advisorsData = data.map(row => ({
      id: row[0],
      username: row[1],
      password: row[2],
      email: row[3],
      role: row[4],
    }));
    return advisorsData;
  } catch (error) {
    console.error("Error fetching advisors:", error);
    throw error;
  }
};

export const addAdvisor = async (advisorData) => {
  try {
    const response = await fetch(`${BASE_URL}/addAdvisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advisorData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error adding advisor:", error);
    throw error;
  }
};

export const editAdvisor = async (id, advisorData) => {
  try {
    const response = await fetch(`${BASE_URL}/editAdvisorByID/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advisorData),
    });
    return await response.json();
  } catch (error) {
    console.error("Error editing advisor:", error);
    throw error;
  }
};

export const deleteAdvisor = async (deleteID) => {
  try {
    const response = await fetch(`${BASE_URL}/deleteAdvisor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: deleteID }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error deleting advisor:", error);
    throw error;
  }
};

// Update Meeting Details
export const updateMeetingDetails = async (payload) => {
  // const url = 'http://localhost:4000/meetings/update_details';
  const url = `${BASE_URL}/meetings/update_details`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error updating meeting details:', error);
    throw error;
  }
};

export const getMeetingStats = async (userId) => {
  try {
    const response = await fetch(`${BASE_URL}/meetings/stats/${userId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error("Error fetching meeting stats:", error);
    throw error;
  }
};

export const getFilteredMeetingStats = async (userId, campaign) => {
  try {
    const response = await fetch(`${BASE_URL}/meetings/stats_filtered/${userId}?campaign=${campaign}`);
    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Error fetching filtered data');
    }
    const filteredStats = await response.json();
    return filteredStats;
  } catch (err) {
    console.error("Filter error:", err);
    throw err;
  }
};

const api = {
  createUser,
  getAdvisorClients,
  getPreviousClients,
  getMeetingCount,
  StorePreMeetingQuestions,
  getCampaignD,
  getSummary,
  adminLogin,
  getAllAdvisors,
  addAdvisor,
  editAdvisor,
  deleteAdvisor,
  fetchPreMeetingQuestions,
  StorePreMeetingQuestions,
  getPreQ,
  updateMeetingDetails,
  getMeetingStats,
  getFilteredMeetingStats,
  URL
};

export default api;
