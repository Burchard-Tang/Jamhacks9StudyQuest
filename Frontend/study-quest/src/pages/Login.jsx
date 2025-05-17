import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Login.css";

const Login = () => {
    const [loginOrSignup, setLoginOrSignup] = useState(true);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const storeUser = (userData) => {
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await axios.post("http://localhost:8081/verifyuser", {
                username,
                password,
            });

            if (res.data.success) {
                storeUser(res.data.user);
                setUsername("");
                setPassword("");
                navigate("/app/dashboard");
            } else {
                setError("Invalid username or password.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError("Login failed. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.put("http://localhost:8081/create", {
                username,
                password,
            });

            if (res.data.success) {
                storeUser(res.data.user);
                setUsername("");
                setPassword("");
                setConfirmPassword("");
                navigate("/app/dashboard");
            } else {
                setError("Signup failed. Username may already exist.");
            }
        } catch (err) {
            console.error("Signup error:", err);
            setError("Signup failed. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <h2>{loginOrSignup ? "Login" : "Sign Up"}</h2>
            <form onSubmit={loginOrSignup ? handleLogin : handleSignup} className="auth-form">
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {!loginOrSignup && (
                    <input
                        type="password"
                        placeholder="Re-enter Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                )}
                <button type="submit" disabled={loading}>
                    {loading
                        ? "Please wait..."
                        : loginOrSignup
                        ? "Login"
                        : "Sign Up"}
                </button>
                {error && <p className="error-message">{error}</p>}
            </form>
            <button
                className="switch-button"
                onClick={() => {
                    setLoginOrSignup(!loginOrSignup);
                    setError("");
                    setPassword("");
                    setConfirmPassword("");
                }}
            >
                {loginOrSignup
                    ? "Need an account? Sign Up"
                    : "Already have an account? Login"}
            </button>
        </div>
    );
};

export default Login;