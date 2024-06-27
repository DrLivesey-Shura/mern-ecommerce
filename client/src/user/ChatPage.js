import { PrettyChatWindow } from "react-chat-engine-pretty";

const ChatsPage = () => {
  const user = JSON.parse(localStorage.getItem("jwt"));

  return (
    <div className="background">
      <div className="chat-wrapper">
        <PrettyChatWindow
          projectId={import.meta.env.VITE_CHAT_ENGINE_PROJECT_ID}
          username={user.username}
          secret={user.secret}
        />
      </div>
    </div>
  );
};

export default ChatsPage;
