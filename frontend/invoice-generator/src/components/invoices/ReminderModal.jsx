import React, { useState, useEffect } from "react";
import { Loader2, Mail, Copy, Check } from "lucide-react";
import Button from "../ui/Button";
import TextareaField from "../ui/TextareaField";
import axiosInstance from "../../utils/axioslnstance";
import { API_PATHS } from "../../utils/apiPaths";
import toast from "react-hot-toast";

const ReminderModal = ({ isOpen, onClose, invoiceId }) => {
  const [reminderText, setReminderText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    if (isOpen && invoiceId) {
      const generateReminder = async () => {
        setIsLoading(true);
        setReminderText("");
        try {
          // First attempt using default (now 30s) timeout
          const response = await axiosInstance.post(
            API_PATHS.AI.GENERATE_REMINDER,
            { invoiceId },
            { timeout: 30000 }
          );
          setReminderText(response.data.reminderText);
        } catch (error) {
          console.error("Error generating reminder (first attempt):", error);
          // If request timed out, retry once with a longer timeout before giving up
          if (
            error &&
            (error.code === "ECONNABORTED" ||
              error.message?.includes("timeout"))
          ) {
            toast.loading("AI is busy — retrying with a longer timeout...");
            try {
              const retryResp = await axiosInstance.post(
                API_PATHS.AI.GENERATE_REMINDER,
                { invoiceId },
                { timeout: 60000 }
              );
              toast.dismiss();
              setReminderText(retryResp.data.reminderText);
            } catch (retryErr) {
              toast.dismiss();
              console.error("Retry failed for generating reminder:", retryErr);
              toast.error(
                "Failed to generate reminder. Showing fallback text."
              );
              // Provide a minimal client-side fallback so the modal remains useful
              setReminderText(
                `Subject: Reminder — Invoice ${invoiceId} is due\n\nHi,\n\nThis is a friendly reminder that invoice ${invoiceId} is due. Please let us know if you need assistance.\n\nBest regards,\nYour Company`
              );
            }
          } else {
            toast.error("Failed to generate reminder. Please try again.");
            console.error("Error generating reminder:", error);
          }
        } finally {
          setIsLoading(false);
        }
      };
      generateReminder();
    }
  }, [isOpen, invoiceId, onClose]);

  if (!isOpen) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(reminderText);
    setHasCopied(true);
    toast.success("Reminder text copied to clipboard!");
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center">
        <div
          className="fixed inset-0 bg-black/10 bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 relative text-left transform transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-900" /> AI-Generated
              Reminder
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <TextareaField
                name="reminderText"
                value={reminderText}
                readOnly
                rows={10}
              />
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={handleCopyToClipboard}
              icon={hasCopied ? Check : Copy}
              disabled={isLoading}
            >
              {hasCopied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
