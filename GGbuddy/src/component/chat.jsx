import { useState, useRef, useEffect } from "react";
import "./chat.css";

export default function Chat() {
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");

  const chats = [
    { id: 1, name: "Alice", messages: ["Hello!", "How are you?"] },
    { id: 2, name: "Bob", messages: ["Hey!", "What's up?"] },
    { id: 3, name: "Charlie", messages: ["Hi!", "Long time no see."] },
  ];

  const chatWindowRef = useRef(null);

  const sendMessage = () => {
    if (message.trim() && activeChat) {
      activeChat.messages.push({ text: message, isUserMessage: true });
      setMessage("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && message.trim()) {
      sendMessage();
    } else if (e.key === "Enter" && e.shiftKey) {
      setMessage(message + "\n");
    }
  };

  useEffect(() => {
    if (chatWindowRef.current) {
      setTimeout(() => {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
      }, 100);
    }
  }, [activeChat?.messages]); 

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        {chats.map((chat) => (
          <button
            key={chat.id}
            className={`chat-item ${activeChat?.id === chat.id ? "active" : ""}`}
            onClick={() => setActiveChat(chat)}
          >
            {chat.name}
          </button>
        ))}
      </div>
      <div className="chat-window" ref={chatWindowRef}>
        {activeChat ? (
          <div>
            <div className="chat-messages">
              {activeChat.messages.map((msg, index) => (
                <div key={index} className="message-f">
                  {!msg.isUserMessage ? (
                    <img src="../../public/LOGO GGbuddy.png" alt="profile" width={"30px"} />
                  ) : (
                    ""
                  )}
                  <div className={`chat-message ${msg.isUserMessage ? "user" : ""}`}>
                    {msg.isUserMessage ? msg.text : msg}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={3}
              />
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className={message.trim() ? "active" : "disabled"}
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <p>Select a chat to start messaging</p>
        )}
      </div>
    </div>
  );
}
