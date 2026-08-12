import React, { useEffect, useRef, useState } from 'react';
import { User, Mail, Phone, Briefcase, ShieldCheck, Camera, Loader2, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useAppDispatch, useAppSelector } from '../../hooks/storeHooks';
import { setAuthSuccess, type UserData } from '../../features/auth/authSlice';
import { DEPARTMENT_GROUPS, type DepartmentOption } from '../../config/departments';

interface UserProfileData {
  name: string;
  email: string;
  mobileNumber: string;
  role: UserData['role'];
  department: DepartmentOption | '';
  title: string;
}

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200';

const ProfilePage = () => {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();

  // Notification States
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Form Fields State
  const [formData, setFormData] = useState<UserProfileData>({
    name: '',
    email: '',
    mobileNumber: '',
    role: 'employee',
    department: '',
    title: '',
  });

  // ── Avatar — now actually stateful, so the file picker & reset button do something ──
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync global user state directly with formData fields
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        mobileNumber: user.mobileNumber ? String(user.mobileNumber) : '',
        role: user.role || 'employee',
        department: (user.department as DepartmentOption | undefined) || '',
        title: user.title || '',
      });
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB.');
      return;
    }

    setError('');
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUseDefaultImage = () => {
    setAvatar(DEFAULT_AVATAR);
    setAvatarFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Simple digits-only guard so we never send NaN to the backend
  const handleMobileChange = (value: string) => {
    const digitsOnly = value.replace(/[^\d]/g, '');
    setFormData((prev) => ({ ...prev, mobileNumber: digitsOnly }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (!formData.mobileNumber || formData.mobileNumber.length < 7) {
      setError('Please enter a valid mobile number.');
      return;
    }

    setUpdating(true);
    setError('');
    setSuccess(false);

    try {
      const form = new FormData();
      form.append('name', formData.name.trim());
      form.append('mobileNumber', formData.mobileNumber);
      form.append('title', formData.title.trim());
      if (formData.department) form.append('department', formData.department);
      if (avatarFile) form.append('avatar', avatarFile);

      const response = await axiosInstance.put('/auth/update-profile', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.token && response.data?.user) {
        dispatch(
          setAuthSuccess({
            token: response.data.token,
            user: response.data.user,
          })
        );
        setFormData((prev) => ({
          ...prev,
          name: response.data.user.name ?? prev.name,
          role: response.data.user.role ?? prev.role,
          title: response.data.user.title ?? prev.title,
          department: (response.data.user.department as DepartmentOption | undefined) ?? prev.department,
        }));
        if (response.data.user.avatarUrl) {
          setAvatar(response.data.user.avatarUrl);
        }
      }

      setAvatarFile(null); // clear staged file after a successful save
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong while updating your profile.');
    } finally {
      setUpdating(false);
    }
};

  return (
    <div className="h-full min-h-0 overflow-y-auto overflow-x-hidden bg-white px-4 py-8 sm:px-10">
      <div className="max-w-4xl mx-auto">

        {/* Title Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">Profile</h2>
          <p className="text-sm text-zinc-500 mt-1">Manage your profile and account details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left: Avatar card */}
          <div className="flex flex-col items-center p-6 border border-zinc-200 rounded-3xl bg-white shadow-sm h-fit space-y-4">
            <div className="relative group">
              <img
                src={avatar}
                alt={formData.name}
                className="w-28 h-28 rounded-full object-cover ring-4 ring-zinc-100 border border-zinc-200"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-1 right-1 bg-zinc-900 text-white p-2 rounded-full cursor-pointer shadow-md hover:bg-zinc-700 transition-colors"
              >
                <Camera size={14} />
                <input
                  id="avatar-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>

            <div className="text-center">
              <h4 className="text-sm font-semibold text-zinc-950 capitalize">{formData.name || 'User'}</h4>
              <p className="font-mono text-xs text-zinc-400 mt-0.5">{formData.email}</p>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold py-2 px-3 border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-colors text-zinc-700"
              >
                <Camera size={13} />
                Change photo
              </button>
              <button
                type="button"
                onClick={handleUseDefaultImage}
                className="flex items-center justify-center gap-1.5 w-full text-xs font-medium text-zinc-400 hover:text-zinc-700 transition-colors"
              >
                <RotateCcw size={12} />
                Use default image
              </button>
            </div>
          </div>

          {/* Right: Form */}
          <div className="md:col-span-2 border border-zinc-200 rounded-3xl bg-white shadow-sm p-6 sm:p-8">

            {success && (
              <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-700 mb-5">
                <CheckCircle size={18} />
                <span className="font-medium">Profile updated successfully!</span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-600 mb-5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">

              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Full name</label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Email (read only)</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 pl-10 pr-4 text-sm text-zinc-400 cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Mobile number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={formData.mobileNumber}
                      onChange={(e) => handleMobileChange(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">System role</label>
                  <div className="relative">
                    <ShieldCheck size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" />
                    <input
                      type="text"
                      value={formData.role}
                      disabled
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-100 py-2.5 pl-10 pr-4 text-sm text-zinc-500 uppercase font-semibold tracking-wide cursor-not-allowed select-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Job title</label>
                  <div className="relative">
                    <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Lead Fullstack Engineer"
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="font-mono text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value as DepartmentOption })}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 px-3 text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="">Select department</option>
                  {DEPARTMENT_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <p className="text-xs text-zinc-400">Departments are separate from roles and help organize team structure.</p>
              </div>

              {/* Actions */}
              <div className="flex justify-end pt-4 border-t border-zinc-100">
                <button
                  type="submit"
                  disabled={updating}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <span>Save changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;