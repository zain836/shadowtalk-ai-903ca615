import chatbotLogo from "@/assets/chatbot-logo.png";

interface ChatbotLogoProps {
  size?: number;
  className?: string;
}

const ChatbotLogo = ({ size = 24, className = "" }: ChatbotLogoProps) => {
  return (
    <img
      src={chatbotLogo}
      alt="ShadowTalk AI"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
};

export default ChatbotLogo;
