import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, Briefcase, Loader2, AlertCircle, CheckCircle, LogOut, ArrowLeft } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { setAuthSuccess } from '../../features/auth/authSlice';
import { useAppDispatch } from '../../hooks/storeHooks';

interface LoggedInUserType {
  name: string;
  email: string;
}

const AcceptInvite = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Loading and Error States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Pre-fetched values from Invitation DB
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  // 🛠️ State to hold currently logged-in user if session exists
  const [loggedInUser, setLoggedInUser] = useState<LoggedInUserType | null>(null);

  // Form input fields
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    mobileNumber: '',
    title: ''
  });

  // 🔴 STEP 1: Session check aur Token verify karo link par aate hi
  useEffect(() => {
    // Aate hi pehle check karo koi already login toh nahi hai
    const existingToken = localStorage.getItem('syncboard_auth_token');
    const existingUserData = localStorage.getItem('syncboard_user_data');

    if (existingToken && existingUserData) {
      try {
        const parsedUser = JSON.parse(existingUserData);
        setLoggedInUser(parsedUser);
      } catch (e) {
        console.error("Error parsing existing user data", e);
      }
    }

    const verifyToken = async () => {
      if (!token) {
        setError('Invitation token is missing in the URL!');
        setLoading(false);
        return;
      }
      try {
        const response = await axiosInstance.get(`/auth/verify-invite?token=${token}`);
        setEmail(response.data.email);
        setRole(response.data.role);
      } catch (err: any) {
        setError(err.response?.data?.message || 'This invitation link is invalid, expired, or already used.');
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, [token]);

  // 🔴 STEP 2: Handle Logout and continue registration
  const handleLogoutAndContinue = () => {
    localStorage.removeItem('syncboard_auth_token');
    localStorage.removeItem('syncboard_user_data');
    localStorage.removeItem('token');
    // State clear karo taaki UI registration form par switch ho jaye
    setLoggedInUser(null); 
  };

  // 🔴 STEP 3: Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password.length < 8) {
      setError("Password should be at least 8 characters long.");
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        email: email, 
        mobileNumber: Number(formData.mobileNumber), 
        password: formData.password,
        role: role,   
        title: formData.title || undefined,
        inviteToken: token 
      };

      const response = await axiosInstance.post('/auth/register', payload);

      if (response.data.token) {
        localStorage.removeItem('syncboard_auth_token');
        localStorage.removeItem('syncboard_user_data');
        localStorage.removeItem('token');
        
        localStorage.setItem('syncboard_auth_token', response.data.token);
        const userData = {
          name: response.data.user?.name || formData.name,
          email: email,
          role: role
        };
        localStorage.setItem('syncboard_user_data', JSON.stringify(userData));
        dispatch(setAuthSuccess(response.data));
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard'); 
      }, 2000);

    } catch (err: any) {
      if (err.response?.data?.errors) {
        setError(err.response.data.errors[0]?.message || 'Validation failed.');
      } else {
        setError(err.response?.data?.message || 'Something went wrong during registration.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-accent" size={36} />
          <p className="text-sm text-text/60 font-medium">Verifying your secure invitation link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12 sm:px-6 lg:px-8 animate-fade-in">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-border bg-bg p-8 shadow-sm transition-all duration-300">
        
        {/* Header Branding */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-accent-bg text-accent mb-4">
            <Briefcase size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-text-h">Join Workspace</h2>
          <p className="mt-1 text-sm text-text/60">Complete your details to set up your team account.</p>
        </div>

        {/* Success Alert Message Layout */}
        {success ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
            <CheckCircle className="text-emerald-500 animate-bounce" size={40} />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-emerald-500">Account Verified!</h4>
              <p className="text-xs text-text/60">Launching workspace environment dashboard...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Error Notification Badge Layout */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-500">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* 🔴 Conditional Setup: Agar Already Logged-in Session milti h */}
            {loggedInUser ? (
              <div className="space-y-5 p-4 rounded-xl border border-border bg-accent-bg/20 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-text/50 font-medium">You are currently logged in as:</p>
                  <h4 className="text-base font-semibold text-text-h">{loggedInUser.name}</h4>
                  <p className="text-xs text-text/60 font-mono truncate">{loggedInUser.email}</p>
                </div>

                <div className="text-xs text-amber-500/90 bg-amber-500/5 border border-amber-500/10 rounded-lg p-2.5">
                  Accepting this invite requires registering a new profile session for this workspace.
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg py-2.5 text-xs font-semibold text-text hover:bg-accent-bg transition-colors"
                  >
                    <ArrowLeft size={14} />
                    Back to Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutAndContinue}
                    className="flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-xs font-semibold text-bg hover:opacity-90 transition-opacity"
                  >
                    <LogOut size={14} />
                    Logout & Register
                  </button>
                </div>
              </div>
            ) : (
              /* Registration Form conditional layout (Only loads when no user is logged in) */
              !email ? (
                <div className="text-center pt-2">
                  <Link to="/login" className="text-sm font-semibold text-accent hover:underline">
                    Go Back to Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Email Display Fields Container */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text/50 uppercase tracking-wider">Invited Email</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" />
                        <input
                          type="text"
                          value={email}
                          disabled
                          className="w-full rounded-lg border border-border/60 bg-accent-bg/40 py-2 pl-8 pr-3 text-xs text-text/50 cursor-not-allowed font-medium truncate"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-text/50 uppercase tracking-wider">Assigned Role</label>
                      <div className="relative">
                        <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/30" />
                        <input
                          type="text"
                          value={role}
                          disabled
                          className="w-full rounded-lg border border-border/60 bg-accent-bg/40 py-2 pl-8 pr-3 text-xs text-accent uppercase font-bold tracking-wide cursor-not-allowed truncate"
                        />
                      </div>
                    </div>
                  </div>

                  <hr className="border-border/40 my-3" />

                  {/* Input Fields Content Block */}
                  <div className="space-y-3.5">
                    {/* Full Name */}
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full rounded-lg border border-border bg-transparent py-2.5 pl-10 pr-4 text-sm text-text-h placeholder:text-text/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
                        required
                      />
                    </div>

                    {/* Mobile Number Input */}
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" />
                      <input
                        type="tel"
                        placeholder="Mobile Number"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                        className="w-full rounded-lg border border-border bg-transparent py-2.5 pl-10 pr-4 text-sm text-text-h placeholder:text-text/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
                        required
                      />
                    </div>

                    {/* Optional Custom Job Title */}
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" />
                      <input
                        type="text"
                        placeholder={`Job Title (e.g. Lead ${role === 'manager' ? 'Manager' : 'Developer'})`}
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-lg border border-border bg-transparent py-2.5 pl-10 pr-4 text-sm text-text-h placeholder:text-text/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
                      />
                    </div>

                    {/* Security Password input */}
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" />
                      <input
                        type="password"
                        placeholder="Password (Min 8 characters)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full rounded-lg border border-border bg-transparent py-2.5 pl-10 pr-4 text-sm text-text-h placeholder:text-text/40 focus:outline-none focus:ring-1 focus:ring-accent/40"
                        required
                      />
                    </div>
                  </div>

                  {/* Confirm Action Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg shadow-sm transition-all hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        <span>Configuring Account...</span>
                      </>
                    ) : (
                      <span>Register & Join Workspace</span>
                    )}
                  </button>
                </form>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptInvite;