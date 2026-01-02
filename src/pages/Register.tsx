import { useState } from "react";
import type { FormEvent } from "react";
import { register, validateEmail, validatePassword, validateName } from "../services/auth.service";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate first name
    if (!formData.firstname.trim()) {
      newErrors.firstname = "First name is required";
    } else if (!validateName(formData.firstname)) {
      newErrors.firstname = "First name must be at least 2 letters";
    }

    // Validate last name
    if (!formData.lastname.trim()) {
      newErrors.lastname = "Last name is required";
    } else if (!validateName(formData.lastname)) {
      newErrors.lastname = "Last name must be at least 2 letters";
    }

    // Validate email
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Validate password
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.message;
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const res = await register({ 
        firstname: formData.firstname, 
        lastname: formData.lastname, 
        email: formData.email, 
        password: formData.password, 
        role 
      });
      
      setMessage(res.message);
      setTimeout(() => {
        navigate("/verify-otp", { state: { email: formData.email } });
      }, 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-rose-600 mb-4">
            <span className="text-3xl">🎬</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-50">Join CINETIME</h1>
          <p className="text-slate-400">Create your movie tracking account</p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.includes("success") 
            ? "bg-green-900/30 border border-green-500/30 text-green-300" 
            : "bg-rose-900/30 border border-rose-500/30 text-rose-300"}`}>
            {message}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">First Name</label>
            <input
              type="text"
              name="firstname"
              value={formData.firstname}
              onChange={handleChange}
              className={`w-full p-3 bg-slate-700 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50 ${
                errors.firstname ? "border-rose-500" : "border-slate-600"
              }`}
              placeholder="John"
            />
            {errors.firstname && (
              <p className="mt-1 text-sm text-rose-400">{errors.firstname}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Last Name</label>
            <input
              type="text"
              name="lastname"
              value={formData.lastname}
              onChange={handleChange}
              className={`w-full p-3 bg-slate-700 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50 ${
                errors.lastname ? "border-rose-500" : "border-slate-600"
              }`}
              placeholder="Doe"
            />
            {errors.lastname && (
              <p className="mt-1 text-sm text-rose-400">{errors.lastname}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full p-3 bg-slate-700 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50 ${
                errors.email ? "border-rose-500" : "border-slate-600"
              }`}
              placeholder="john@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-rose-400">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full p-3 bg-slate-700 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50 ${
                errors.password ? "border-rose-500" : "border-slate-600"
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-rose-400">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              Must be at least 6 characters with one uppercase letter and one number
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full p-3 bg-slate-700 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50 ${
                errors.confirmPassword ? "border-rose-500" : "border-slate-600"
              }`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-rose-400">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Account Type</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
            >
              <option value="USER" className="bg-slate-800">🎬 Movie Enthusiast</option>
              <option value="AUTHOR" className="bg-slate-800">✍️ Content Author</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {role === "AUTHOR" 
                ? "Authors can create content and need admin approval" 
                : "Users can track movies and manage watchlists"}
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Account...
              </span>
            ) : "Create Account"}
          </button>
        </form>

        {/* Terms & Login Link */}
        <div className="mt-6 space-y-4">
          <p className="text-xs text-center text-slate-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
          <p className="text-center text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-rose-400 hover:text-rose-300 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}