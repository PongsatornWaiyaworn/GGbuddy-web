import { useState, useEffect, useRef } from "react";
import "./chat.css";

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState(null);
  const chatWindowRef = useRef(null);
  const [username] = useState("user1");

  useEffect(() => {
    fetch("http://localhost:8080/api/chats?user=" + username)
      .then((res) => res.json())
      .then((data) => {
        setChats(data);
        if (data.length > 0) {
          setActiveChat(data[0]);
        }
      })
      .catch((err) => console.error("Error fetching chats:", err));
  }, [username]);

  useEffect(() => {
    if (activeChat && activeChat.id) {
      fetch(`http://localhost:8080/messages?group_id=${activeChat.id}`)
        .then((res) => res.json())
        .then((data) => {
          setActiveChat((prevChat) => ({
            ...prevChat,
            messages: data,
          }));
        })
        .catch((err) => console.error("Error fetching messages:", err));

      const socket = new WebSocket(`ws://localhost:8080/ws?username=${username}&group_id=${activeChat.id}`);

      socket.onopen = () => console.log("Connected to WebSocket");

      socket.onmessage = (event) => {
        const receivedMessage = JSON.parse(event.data);

        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === receivedMessage.group_id
              ? {
                  ...chat,
                  messages: [
                    ...(chat.messages || []),
                    { text: receivedMessage.message, isUserMessage: receivedMessage.username === username },
                  ],
                }
              : chat
          )
        );
      };

      socket.onclose = () => console.log("Disconnected from WebSocket");
      socket.onerror = (error) => console.error("WebSocket error:", error);

      setWs(socket);
      return () => socket.close();
    }
  }, [activeChat, username]);

  const joinChat = (chat) => {
    setActiveChat(chat);
    if (ws && ws.readyState === WebSocket.OPEN) {
      if (message.trim()) {
        ws.send(JSON.stringify({ room: chat.id, username, type: "join" }));
      }
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      if (activeChat && ws && ws.readyState === WebSocket.OPEN) {
        const newMessage = {
          group_id: activeChat.id,
          sender_id: username,
          content: message.trim(),
          type: "message",
        };
        ws.send(JSON.stringify(newMessage));

        setActiveChat((prevChat) => ({
          ...prevChat,
          messages: [
            ...(prevChat.messages || []),
            { text: message.trim(), isUserMessage: true },
          ],
        }));
        setMessage("");
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return; 
      }
      e.preventDefault();
      sendMessage(); 
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        {chats.map((chat) => (
          <button
            key={chat.id || chat.name}
            className={`chat-item ${activeChat?._id === chat.id ? "active" : ""}`}
            onClick={() => joinChat(chat)}
          >
            {chat.name}
          </button>
        ))}
      </div>

      <div className="chat-window" ref={chatWindowRef}>
        {activeChat ? (
          <div>
            <div className="chat-messages">
              {(activeChat.messages || []).map((msg, index) => (
                <div key={index} className={`chat-message ${msg.sender_id === username ? "user" : ""}`}>
                  {msg.content}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message..."
                rows={3}
                onKeyDown={handleKeyDown} 
              />
              <button onClick={sendMessage} disabled={!message.trim()} className={message.trim() ? "active" : "disabled"}>
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
