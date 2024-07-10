import { API } from "../config";

export const signup = (user) => {
  return fetch(`${API}/signup`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => {
      console.log(err);
    });
};

export const signin = (user) => {
  return fetch(`${API}/signin`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(user),
  })
    .then((response) => {
      return response.json();
    })
    .catch((err) => {
      console.log(err);
    });
};

export const authenticate = (data, next) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("jwt", JSON.stringify(data));
    next();
  }
};

export const signout = (next) => {
  if (typeof window !== "undefined") {
    const jwt = JSON.parse(localStorage.getItem("jwt"));
    if (jwt) {
      const token = jwt.token;
      localStorage.removeItem("jwt");
      next();
      return fetch(`${API}/signout`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`, // Send the token in the Authorization header
        },
      })
        .then((response) => {
          console.log("signout", response);
        })
        .catch((err) => console.log(err));
    } else {
      next();
    }
  }
};

export const isAuthenticated = () => {
  if (typeof window === "undefined") {
    return false;
  }
  if (localStorage.getItem("jwt")) {
    const user = JSON.parse(localStorage.getItem("jwt"));
    return user;
  } else {
    return false;
  }
};
