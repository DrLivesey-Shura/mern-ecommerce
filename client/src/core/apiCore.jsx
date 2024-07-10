import { API } from "../config";
import queryString from "query-string";

export const getProducts = async (sortBy) => {
  try {
    const response = await fetch(
      `${API}/products?sortBy=${sortBy}&order=desc&limit=6`,
      {
        method: "GET",
      }
    );
    return await response.json();
  } catch (err) {
    console.error("Error fetching products:", err);
    throw err;
  }
};

export const getCategories = async () => {
  try {
    const response = await fetch(`${API}/categories`, {
      method: "GET",
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching categories:", err);
    throw err;
  }
};

export const getFilteredProducts = async (skip, limit, filters = {}) => {
  const data = {
    limit,
    skip,
    filters,
  };
  try {
    const response = await fetch(`${API}/products/by/search`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    return await response.json();
  } catch (err) {
    console.error("Error fetching filtered products:", err);
    throw err;
  }
};

export const list = async (params) => {
  const query = queryString.stringify(params);
  console.log("query", query);
  try {
    const response = await fetch(`${API}/products/search?${query}`, {
      method: "GET",
    });
    return await response.json();
  } catch (err) {
    console.error("Error listing products:", err);
    throw err;
  }
};

export const read = async (productId) => {
  try {
    const response = await fetch(`${API}/product/${productId}`, {
      method: "GET",
    });
    return await response.json();
  } catch (err) {
    console.error("Error reading product:", err);
    throw err;
  }
};

export const listRelated = async (productId) => {
  try {
    const response = await fetch(`${API}/products/related/${productId}`, {
      method: "GET",
    });
    return await response.json();
  } catch (err) {
    console.error("Error listing related products:", err);
    throw err;
  }
};

export const getBraintreeClientToken = async (userId, token, code) => {
  try {
    const response = await fetch(`${API}/braintree/getToken/${userId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-code": code,
      },
    });
    return await response.json();
  } catch (err) {
    console.error("Error getting Braintree client token:", err);
    throw err;
  }
};

export const processPayment = async (userId, token, paymentData, code) => {
  try {
    const response = await fetch(`${API}/braintree/payment/${userId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-code": code,
      },
      body: JSON.stringify(paymentData),
    });
    return await response.json();
  } catch (err) {
    console.error("Error processing payment:", err);
    throw err;
  }
};

export const createOrder = async (userId, token, createOrderData, code) => {
  try {
    const response = await fetch(`${API}/order/create/${userId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-code": code,
      },
      body: JSON.stringify({ order: createOrderData }),
    });
    return await response.json();
  } catch (err) {
    console.error("Error creating order:", err);
    throw err;
  }
};
