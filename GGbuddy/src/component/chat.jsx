import { useState, useEffect, useRef } from "react";
import "./chat.css";

export default function Chat() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState(null);
  const chatWindowRef = useRef(null);
  const [username] = useState("user02");

  const scrollToBottom = () => {
    if (chatWindowRef.current) {
      setTimeout(() => {
        chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
      }, 100);
    }
  };

  useEffect(() => {
    fetch("http://localhost:8080/api/chats?user=" + username)
      .then((res) => res.json())
      .then((data) => {
        const sortedChats = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  
        setChats(sortedChats);
  
        if (sortedChats.length > 0) {
          setActiveChat(sortedChats[0]);
          setTimeout(() => {
            scrollToBottom();
          }, 0);
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

    setTimeout(() => {
      scrollToBottom();
    }, 0);

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
      setTimeout(() => {
        scrollToBottom();
      }, 0);
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

  const formatShortDateThai = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).replace(" ", ""); 
  };  

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        {chats.map((chat) => (
          <button
            key={chat.id || chat.name}
            className={`chat-item ${activeChat?.id === chat.id ? "active" : ""}`} 
            onClick={() => joinChat(chat)}
          >
            <img width={'40px'} src="https://static.vecteezy.com/system/resources/previews/019/017/536/original/valorant-logo-transparent-free-png.png" alt="" />
            {chat.name}
          </button>
        ))}
      </div>

      <div className="chat-window" ref={chatWindowRef}>
        {activeChat ? (
          <div>
            <div className="chat-messages">
              {(activeChat.messages || []).map((msg, index) => (
                <div key={index}>
                  {msg.sender_id !== username && (
                    <div>
                      <div className="message-info">
                        จาก {msg.sender_id} 
                        {formatShortDateThai(msg.timestamp)}
                      </div>
                    </div>
                  )}

                  {msg.sender_id === username && (
                    <div>
                      <div className="message-info-user">
                        {formatShortDateThai(msg.timestamp)}
                      </div>
                    </div>
                  )}

                  <div className={`chat-message ${msg.sender_id === username ? "user" : ""}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="message..."
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
