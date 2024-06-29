import React, { useState, useEffect } from "react";
import Button from "@material-ui/core/Button";
import {
  getBraintreeClientToken,
  processPayment,
  createOrder,
} from "./apiCore";
import { emptyCart } from "./cartHelpers";
import { isAuthenticated } from "../auth";
import { Link } from "react-router-dom";
import DropIn from "braintree-web-drop-in-react";

const Checkout = ({ products, setRun = (f) => f, run = undefined }) => {
  const [data, setData] = useState({
    loading: false,
    success: false,
    clientToken: null,
    error: "",
    instance: null,
    address: "",
  });

  const userId = isAuthenticated() && isAuthenticated().user._id;
  const token = isAuthenticated() && isAuthenticated().token;

  useEffect(() => {
    getBraintreeClientToken(userId, token).then((data) => {
      if (data.error) {
        setData((prevState) => ({ ...prevState, error: data.error }));
      } else {
        setData((prevState) => ({
          ...prevState,
          clientToken: data.clientToken,
        }));
      }
    });
  }, [userId, token]);

  const handleAddress = (event) => {
    setData((prevState) => ({ ...prevState, address: event.target.value }));
  };

  const getTotal = () => {
    return products.reduce((currentValue, nextValue) => {
      return currentValue + nextValue.count * nextValue.price;
    }, 0);
  };

  const showCheckout = () => {
    return isAuthenticated() ? (
      <div>{showDropIn()}</div>
    ) : (
      <Link to="/signin">
        <Button variant="contained" color="primary">
          Sign in to checkout
        </Button>
      </Link>
    );
  };

  const buy = async () => {
    if (!data.instance) {
      console.log("Payment instance not available", data);
      return;
    }

    setData((prevState) => ({ ...prevState, loading: true }));

    try {
      const paymentMethodData = await data.instance.requestPaymentMethod();
      const nonce = paymentMethodData.nonce;

      const paymentData = {
        paymentMethodNonce: nonce,
        amount: getTotal(products),
      };

      const paymentResponse = await processPayment(userId, token, paymentData);
      console.log("Payment response: ", paymentResponse);

      const createOrderData = {
        products: products,
        transaction_id: paymentResponse.transaction.id,
        amount: paymentResponse.transaction.amount,
        address: data.address,
      };

      const orderResponse = await createOrder(userId, token, createOrderData);
      console.log("Order response: ", orderResponse);

      emptyCart(() => {
        setRun(!run); // run useEffect in parent Cart
        console.log("Payment successful and cart emptied");
        setData((prevState) => ({
          ...prevState,
          loading: false,
          success: true,
        }));
      });
    } catch (error) {
      console.log("Error: ", error);
      setData((prevState) => ({
        ...prevState,
        loading: false,
        error: error.message,
      }));
    }
  };

  const showDropIn = () => (
    <div onBlur={() => setData((prevState) => ({ ...prevState, error: "" }))}>
      {data.clientToken !== null && products.length > 0 ? (
        <div>
          <div className="gorm-group mb-3">
            <label className="text-muted">Delivery address:</label>
            <textarea
              onChange={handleAddress}
              className="form-control"
              value={data.address}
              placeholder="Type your delivery address here..."
            />
          </div>

          <DropIn
            options={{
              authorization: data.clientToken,
              paypal: {
                flow: "vault",
              },
            }}
            onInstance={(instance) =>
              setData((prevState) => ({ ...prevState, instance }))
            }
          />
          <button onClick={buy} className="btn btn-success btn-block">
            Pay
          </button>
        </div>
      ) : null}
    </div>
  );

  const showError = (error) => (
    <div
      className="alert alert-danger"
      style={{ display: error ? "" : "none" }}
    >
      {error}
    </div>
  );

  const showSuccess = (success) => (
    <div
      className="alert alert-info"
      style={{ display: success ? "" : "none" }}
    >
      Thanks! Your payment was successful!
    </div>
  );

  const showLoading = (loading) =>
    loading && <h2 className="text-danger">Loading...</h2>;

  return (
    <div>
      <h2>Total: ${getTotal()}</h2>
      {showLoading(data.loading)}
      {showSuccess(data.success)}
      {showError(data.error)}
      {showCheckout()}
    </div>
  );
};

export default Checkout;
