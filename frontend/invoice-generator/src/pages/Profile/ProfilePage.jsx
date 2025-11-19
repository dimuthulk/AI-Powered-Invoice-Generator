import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Loader2, User, Mail, Building, Phone, MapPin } from "lucide-react";
import axiosInstance from "../../utils/axioslnstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";
import InputField from "../../components/ui/InputField";
import TextareaField from "../../components/ui/TextareaField";

function ProfilePage() {
  const { user, setUser, updateUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    businessName: "",
    address: "",
    phone: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        businessName: user.businessName || "",
        address: user.address || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // try context helper first
      if (typeof updateUser === "function") {
        const updated = await updateUser(formData);
        if (updated) setUser(updated);
      } else {
        // fallback to direct API call
        const response = await axiosInstance.put(
          API_PATHS.AUTH.UPDATE_PROFILE,
          formData
        );
        setUser(response.data);
      }
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center w-8 h-8 animate-spin">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden max-w-4xl mx-auto">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-900">My Profile</h3>
      </div>

      <form onSubmit={handleUpdateProfile}>
        <div className="p-6 space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700 mb-2"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-slate-400"></Mail>
              </div>
              <input
                type="email"
                readOnly
                value={user?.email || ""}
                className="w-full h-10 pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 dissabled:cursor-not-allowed"
                disabled
              />
            </div>
          </div>

          <InputField
            label="Full Name"
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            icon={User}
            placeholder="Enter your full name"
          />

          <div className="pt-6 border-t border-slate-200">
            <h4 className="text-lg font-medium text-slate-900">
              Business Information
            </h4>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              This will be used to pre-fill the "Bill From" section of your
              invoices.
            </p>
            <div className="space-y-4">
              <InputField
                label="Business Name"
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                icon={Building}
                placeholder="Enter your business name"
              />
              <TextareaField
                label="Address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                icon={MapPin}
                placeholder="123 Main St, City, Sri Lanka"
              />

              <InputField
                label="Phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                icon={Phone}
                placeholder="+94 71 234 5678"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center px-4 py-2 h-10 bg-blue-900 hover:bg-blue-800 text-white font-medium text-sm rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {isUpdating ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProfilePage;
