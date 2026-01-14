import { useState } from "react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EditMessageDialogProps {
  message: string;
  onSave: (newMessage: string) => void;
  onCancel: () => void;
}

export const EditMessageDialog = ({ message, onSave, onCancel }: EditMessageDialogProps) => {
  const [editedMessage, setEditedMessage] = useState(message);

  const handleSave = () => {
    if (editedMessage.trim()) {
      onSave(editedMessage.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-medium">Edit Message</span>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <Textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            placeholder="Edit your message..."
            autoFocus
          />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!editedMessage.trim()}>
              <Check className="h-4 w-4 mr-2" />
              Save & Resend
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
