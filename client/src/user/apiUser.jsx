import { API } from "../config";

export const read = async (userId, token, code) => {
  try {
    const response = await fetch(`${API}/user/${userId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error reading user data:", err);
    throw err;
  }
};

export const update = async (userId, token, user, code) => {
  try {
    const response = await fetch(`${API}/user/${userId}`, {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });
    return await response.json();
  } catch (err) {
    console.error("Error updating user data:", err);
    throw err;
  }
};

export const updateUser = (user, next) => {
  if (typeof window !== "undefined") {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      let auth = JSON.parse(jwt);
      auth.user = user;
      localStorage.setItem("jwt", JSON.stringify(auth));
      next();
    }
  }
};

export const getPurchaseHistory = async (userId, token, code) => {
  try {
    const response = await fetch(`${API}/orders/by/user/${userId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching purchase history:", err);
    throw err;
  }
};
