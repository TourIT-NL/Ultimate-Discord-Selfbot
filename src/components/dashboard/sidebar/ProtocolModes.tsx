import {
  MessageSquare,
  Server,
  Users,
  Download,
  Shield,
  Fingerprint,
  CreditCard,
} from "lucide-react";

interface ProtocolModesProps {
  mode: string;
  setMode: (mode: any) => void;
  isProcessing: boolean;
}

export const ProtocolModes = ({
  mode,
  setMode,
  isProcessing,
}: ProtocolModesProps) => {
  const modes = [
    {
      id: "messages",
      label: "Messages",
      icon: MessageSquare,
      title: "Manage and delete message history",
    },
    {
      id: "servers",
      label: "Servers",
      icon: Server,
      title: "Leave servers and manage memberships",
    },
    {
      id: "identity",
      label: "Identity",
      icon: Users,
      title: "Manage friends and identity links",
    },
    {
      id: "export",
      label: "Extract",
      icon: Download,
      title: "Export attachments and chat history",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      title: "Security audit and token management",
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: Fingerprint,
      title: "Privacy hardening and GDPR tools",
    },
    {
      id: "account",
      label: "Billing",
      icon: CreditCard,
      title: "Billing and financial footprint audit",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 px-2">
      {modes.map((m) => (
        <button
          key={m.id}
          disabled={isProcessing}
          onClick={() => setMode(m.id)}
          title={m.title}
          className={`flex items-center gap-3 p-3 rounded-m3-xl transition-all border-2 ${
            mode === m.id
              ? "bg-m3-primaryContainer text-m3-onPrimaryContainer border-m3-primary shadow-lg scale-105"
              : "bg-black/20 text-m3-onSurfaceVariant border-transparent hover:bg-m3-surfaceVariant/40 hover:border-m3-outlineVariant/30"
          } ${isProcessing ? "opacity-50 cursor-not-allowed" : "active:scale-95"}`}
        >
          <m.icon className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-tighter">
            {m.label}
          </span>
        </button>
      ))}
    </div>
  );
};
