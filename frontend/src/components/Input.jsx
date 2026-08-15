import React from "react";
import "./Input.css";

export const Input = ({ label, error, className = "", ...props }) => {
  return (
    <div className={`input-group ${className}`}>
      {label && <label>{label}</label>}
      <input className={`input-field ${error ? "error" : ""}`} {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
};
