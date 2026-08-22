import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";

const socket = io.connect(
  import.meta.env.VITE_API_URL || "http://localhost:3005",
);

function useVisualViewportHeight() {
  const [height, setHeight] = useState(
    window.visualViewport ? window.visualViewport.height : window.innerHeight,
  );

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      setHeight(window.visualViewport.height);
      // Force page scroll position back to top when viewport changes
      window.scrollTo(0, 0);
    };

    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);

    return () => {
      window.visualViewport.removeEventListener("resize", handleResize);
      window.visualViewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  return height;
}

export default function App() {
  const [room, setRoom] = useState("");
  const [joinedRoom, setJoinedRoom] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const viewportHeight = useVisualViewportHeight();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Reset page window offset when tapping input fields
  const handleFocus = () => {
    setTimeout(() => {
      window.scrollTo(0, 0);
      scrollToBottom();
    }, 100);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    if (room.trim()) {
      socket.emit("join_room", room);
      setJoinedRoom(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageData = {
      room,
      message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    socket.emit("send_message", messageData);
    setMessages((prev) => [...prev, { ...messageData, isMe: true }]);
    setMessage("");
  };

  useEffect(() => {
    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, { ...data, isMe: false }]);
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []);

  return (
    <div
      style={{ height: `${viewportHeight}px` }}
      className="fixed inset-x-0 top-0 flex items-center justify-center bg-zinc-900 text-zinc-100 sm:p-4 overflow-hidden"
    >
      {!joinedRoom ? (
        <form
          onSubmit={joinRoom}
          className="flex flex-col gap-4 w-full max-w-sm bg-zinc-800 p-6 rounded-2xl border border-zinc-700 shadow-xl m-4"
        >
          <h2 className="text-xl font-bold text-center">Join a Chat Room</h2>
          <input
            type="text"
            placeholder="Enter Room ID (e.g., room123)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            onFocus={handleFocus}
            className="bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Enter Room
          </button>
        </form>
      ) : (
        <div className="flex flex-col h-full sm:h-[600px] w-full max-w-md bg-zinc-800 border-0 sm:border border-zinc-700 sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-zinc-700 bg-zinc-800/50 backdrop-blur flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h1 className="font-semibold text-zinc-100 text-sm sm:text-base">
                  Live Chat
                </h1>
                <p className="text-xs text-zinc-400">Room: {room}</p>
              </div>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-zinc-500 text-sm">
                No messages in room "{room}" yet.
              </div>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.isMe
                        ? "bg-indigo-600 text-white rounded-br-xs"
                        : "bg-zinc-700 text-zinc-100 rounded-bl-xs"
                    }`}
                  >
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 px-1 font-mono">
                    {msg.time}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={sendMessage}
            className="p-3 bg-zinc-800 border-t border-zinc-700 flex gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onFocus={handleFocus}
              className="flex-1 bg-zinc-900 text-zinc-100 placeholder-zinc-500 text-sm px-4 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
