import React, { useState, useEffect } from "react";
import Layout from "../core/Layout";
import { isAuthenticated } from "../auth";
import { Link } from "react-router-dom";
import { getPurchaseHistory } from "./apiUser";
import moment from "moment";

const Dashboard = () => {
  const [history, setHistory] = useState([]);

  const {
    user: { _id, name, email, role },
  } = isAuthenticated();

  const token = isAuthenticated().token;

  const init = (userId, token) => {
    getPurchaseHistory(userId, token).then((data) => {
      if (data.error) {
        console.log(data.error);
      } else {
        setHistory(data);
      }
    });
  };

  useEffect(() => {
    init(_id, token);
  }, []);

  const userLinks = () => {
    return (
      <div className="card">
        <h4 className="card-header">User links</h4>
        <ul className="list-group">
          <li className="list-group-item">
            <Link className="nav-link" to="/cart">
              My cart
            </Link>
          </li>
          <li className="list-group-item">
            <Link className="nav-link" to={`/profile/${_id}`}>
              Update profile
            </Link>
          </li>
        </ul>
      </div>
    );
  };

  const userInfo = () => {
    return (
      <div className="card mb-5">
        <h3 className="card-header">User information</h3>
        <ul className="list-group">
          <li className="list-group-item">{name}</li>
          <li className="list-group-item">{email}</li>
          <li className="list-group-item">
            {role === 1 ? "Admin" : "Registered user"}
          </li>
        </ul>
      </div>
    );
  };

  const showInput = (key, value) => (
    <div className="input-group mb-2 mr-sm-2">
      <div className="input-group-prepend">
        <div className="input-group-text">{key}</div>
      </div>
      <input type="text" value={value} className="form-control" readOnly />
    </div>
  );

  const purchaseHistory = (history) => {
    return (
      <div className="card mb-5">
        <h3 className="card-header">Purchase history</h3>
        <ul className="list-group">
          <li className="list-group-item">
            {history.map((h, i) => {
              return (
                <div>
                  <h2 className="mb-3">
                    <span className="bg-primary">Order ID: {h._id}</span>
                  </h2>
                  {h.products.map((p, i) => {
                    return (
                      <>
                        {/* <div key={i}> */}
                        <div
                          className="mb-3"
                          key={i}
                          style={{
                            padding: "12px",
                            // borderBottom: "1px solid indigo",
                          }}
                        >
                          <h6>{showInput("Product name", p.name)}</h6>
                          <h6>{showInput("Product price", p.price)}</h6>
                          <h6>{showInput("Quantity", p.count)}</h6>
                        </div>
                      </>
                    );
                  })}

                  <h6>{showInput("Status", h.status)}</h6>
                  <h6>
                    {showInput(
                      "Purchased date",
                      new Date(h.createdAt).toLocaleString("en-US", {
                        dateStyle: "full",
                        timeStyle: "long",
                      })
                    )}
                  </h6>
                  <h6>{showInput("Total", h.amount)}</h6>
                  <hr />
                </div>
              );
            })}
          </li>
        </ul>
      </div>
    );
  };

  return (
    <Layout
      title="Dashboard"
      description={`${name}`}
      className="container-fluid"
    >
      <div className="row">
        <div className="col-md-3">{userLinks()}</div>
        <div className="col-md-9">
          {userInfo()}
          {purchaseHistory(history)}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
