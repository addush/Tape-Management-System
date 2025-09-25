import React, { useState, useEffect } from "react";
import bcrypt from "bcryptjs";
import logo from "../src/logo.png"; 
// Utility for localStorage persistence (optional)
const loadUsers = () => {
  const users = localStorage.getItem("users");
  return users ? JSON.parse(users) : [{ username: "admin", passwordHash: bcrypt.hashSync("password123", 10) }];
};

const saveUsers = (users) => {
  localStorage.setItem("users", JSON.stringify(users));
};

export default function LoginPage({ onLoginSuccess }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [users, setUsers] = useState(loadUsers());

  // Registration form state
  const [regForm, setRegForm] = useState({ username: "", password: "", confirmPassword: "" });
  const [regError, setRegError] = useState("");

  // Save users to localStorage whenever users state changes
  useEffect(() => {
    saveUsers(users);
  }, [users]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  function handleRegChange(e) {
    setRegForm({ ...regForm, [e.target.name]: e.target.value });
    setRegError("");
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const foundUser = users.find(u => u.username === form.username);
    if (foundUser) {
      if (bcrypt.compareSync(form.password, foundUser.passwordHash)) {
        onLoginSuccess();
      } else {
        setError("Invalid password.");
      }
    } else {
      setError("User not found.");
    }
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();

    const { username, password, confirmPassword } = regForm;
    if (!username || !password || !confirmPassword) {
      setRegError("All fields required.");
      return;
    }
    if (password !== confirmPassword) {
      setRegError("Passwords do not match.");
      return;
    }
    if (users.find(u => u.username === username)) {
      setRegError("Username already taken.");
      return;
    }

    // Hash the password and add new user
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newUsers = [...users, { username, passwordHash: hashedPassword }];
    setUsers(newUsers);

    alert(`User "${username}" registered successfully! Please login.`);
    setIsRegistering(false);

    // Clear registration form
    setRegForm({ username: "", password: "", confirmPassword: "" });
  }

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f0f4f8",
      }}
    >
      {!isRegistering ? (
        // LOGIN FORM
        <form
          onSubmit={handleLoginSubmit}
          style={{
            padding: 30,
            background: "white",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: 320,
            textAlign: "center",
          }}
        >
          {/* Logo image above the header */}
        <img
          src={logo}
          alt="Logo"
          style={{
            width: 120,
            marginBottom: 20,
            display: "block",
            marginLeft: "auto",
            marginRight: "auto",
          }}
          />
          <h2 style={{ marginBottom: 20 }}>Tape Management Login</h2>

          <label style={{ display: "block", textAlign: "left" }}>
            Username
            <input
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: 8,
                marginTop: 5,
                marginBottom: 15,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              autoComplete="username"
            />
          </label>
          <label style={{ display: "block", textAlign: "left" }}>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: 8,
                marginTop: 5,
                marginBottom: 15,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              autoComplete="current-password"
            />
          </label>
          {error && (
            <div
              style={{
                color: "red",
                marginBottom: 10,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              background: "#0069d9",
              border: "none",
              borderRadius: 4,
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Log In
          </button>
          <p style={{ marginTop: 15 }}>
            Don't have an account?{" "}
            <button type="button" style={{ color: "#0069d9", border: "none", background: "none", cursor: "pointer", padding: 0 }} onClick={() => setIsRegistering(true)}>
              Register here
            </button>
          </p>
        </form>
      ) : (
        // REGISTRATION FORM
        <form
          onSubmit={handleRegisterSubmit}
          style={{
            padding: 30,
            background: "white",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            width: 320,
            textAlign: "center",
          }}
        >
          <h2 style={{ marginBottom: 20 }}>Register New User</h2>

          <label style={{ display: "block", textAlign: "left" }}>
            Username
            <input
              name="username"
              type="text"
              value={regForm.username}
              onChange={handleRegChange}
              required
              style={{
                width: "100%",
                padding: 8,
                marginTop: 5,
                marginBottom: 15,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              autoComplete="username"
            />
          </label>
          <label style={{ display: "block", textAlign: "left" }}>
            Password
            <input
              name="password"
              type="password"
              value={regForm.password}
              onChange={handleRegChange}
              required
              style={{
                width: "100%",
                padding: 8,
                marginTop: 5,
                marginBottom: 15,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              autoComplete="new-password"
            />
          </label>
          <label style={{ display: "block", textAlign: "left" }}>
            Confirm Password
            <input
              name="confirmPassword"
              type="password"
              value={regForm.confirmPassword}
              onChange={handleRegChange}
              required
              style={{
                width: "100%",
                padding: 8,
                marginTop: 5,
                marginBottom: 15,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
              autoComplete="new-password"
            />
          </label>
          {regError && (
            <div
              style={{
                color: "red",
                marginBottom: 10,
                fontSize: 14,
                textAlign: "center",
              }}
            >
              {regError}
            </div>
          )}
          <button
            type="submit"
            style={{
              width: "100%",
              padding: 10,
              background: "green",
              border: "none",
              borderRadius: 4,
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Register
          </button>
          <p style={{ marginTop: 15 }}>
            Already have an account?{" "}
            <button type="button" style={{ color: "#0069d9", border: "none", background: "none", cursor: "pointer", padding: 0 }} onClick={() => setIsRegistering(false)}>
              Log in here
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
