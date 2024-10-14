import React, { useState } from "react";
import "./App.css";
import { ReactSVG } from "react-svg";
import useMyStore, { Chats } from "./stores/Store";
import getChats from "./services/getChats";
import createChat from "./services/createChat";
import Loading from "./components/Loading";
import getNeedInfos from "./services/getNeedInfos";
import sendMessage from "./services/sendMessage";
import MarkdownPreview from "@uiw/react-markdown-preview";
import getConfig from "./services/getConfig";
import NotTokenAllowed from "./components/NotTokenAllowed";
import Update from "./components/Update";

function App() {
  const { chats, setChats } = useMyStore();
  const [selectChat, setSelectChat] = useState<Chats | undefined>(undefined);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState<string | undefined>(undefined);
  const [leftPanel, setLeftPanel] = useState(true);
  const messagesRef = React.useRef<any>();
  const [update, setUpdate] = React.useState<{ download: string; version: string } | undefined>(
    undefined
  );
  const [tokenDefined, setTokenDefined] = useState(false);

  const handleCreateChatClick = React.useCallback(async () => {
    const chat = selectChat;
    if (chat) {
      if (chat.messages.length <= 0) {
        return;
      }
    }

    setLoading("Creating your chat...");
    const newChat = await createChat((await getConfig()).get("daijin_token"));
    setLoading(undefined);

    if (newChat) {
      setChats([...chats, newChat]);
      setSelectChat(newChat);
    }
  }, []);

  React.useEffect(() => {
    const messages = messagesRef.current;

    if (messages) {
      messages.scrollTo(0, messages.scrollHeight);
    }
  }, [chats, selectChat]);

  const HandleSendMessage = React.useCallback(async () => {
    if (!selectChat) {
      return;
    }

    if (prompt.length < 0) {
      return;
    }

    setLoading("Getting the data we will need...");
    const system_infos = await getNeedInfos((await getConfig()).get("daijin_token"), prompt);
    setLoading("Generating your response...");
    const response = await sendMessage(
      (await getConfig()).get("daijin_token"),
      selectChat.id,
      prompt,
      system_infos?.infos ?? "",
      system_infos?.image
    );
    setLoading(undefined);

    const mychats = chats.map((chat) => {
      if (chat.id === selectChat.id) {
        return {
          ...chat,
          messages: [
            ...chat.messages,
            {
              role: "user",
              content: prompt,
            },
            {
              role: "assistant",
              content: response,
            },
          ],
        };
      }

      return chat;
    });

    setChats(mychats);
    setSelectChat(mychats.find((chat) => chat.id === selectChat.id) ?? undefined);
    setPrompt("");
  }, [prompt, selectChat]);

  const handleOnKeyPress = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && event.ctrlKey) {
        HandleSendMessage();
      }
    },
    [HandleSendMessage]
  );

  React.useEffect(() => {
    async function findChats() {
      setLoading("Taking your chats...");
      const chats = await getChats((await getConfig()).get("daijin_token"));
      setLoading(undefined);

      setSelectChat(chats[0] ?? undefined);
      setChats(chats);
    }

    async function setIsToken() {
      const token = (await getConfig()).get("daijin_token");
      setTokenDefined(!!token);
    }

    findChats();
    setIsToken();
  }, []);

  return (
    <div className="container">
      {update && <Update />}
      <div className="flex" style={{ height: update ? "calc(100vh - 60px)" : "100vh" }}>
        <div className={`menubar ${leftPanel ? "active" : ""}`}>
          <div className="title">
            <ReactSVG
              className="open_panel"
              src="./left_panel_close.svg"
              onClick={selectChat ? () => setLeftPanel(false) : undefined}
            />
            <p className="poppins">Your chat list</p>
            <ReactSVG
              className="open_panel"
              src="./close.svg"
              onClick={selectChat ? () => setLeftPanel(false) : undefined}
            />
          </div>
          <button className="create_btn" onClick={handleCreateChatClick}>
            <ReactSVG src="./generator-icon-white.svg" />
            CREATE NEW CHAT
          </button>

          <span className="seperator2"></span>

          <div className="chats">
            {chats.map((chat) => (
              <button
                key={chat.id}
                className={`select_btn ${selectChat?.id === chat.id ? "select_btn_active" : ""}`}
                onClick={() => setSelectChat(chat)}
              >
                {chat.title}
              </button>
            ))}
          </div>
        </div>
        {tokenDefined ? (
          <>
            {loading ? (
              <Loading message={loading} />
            ) : (
              <>
                {selectChat && (
                  <div className="body">
                    <div className="input_user">
                      {!leftPanel && (
                        <ReactSVG
                          className="open_panel"
                          src="./left_panel_open.svg"
                          onClick={() => setLeftPanel(true)}
                        />
                      )}
                      <label>
                        <ReactSVG src="./generator-icon.svg" />
                        <textarea
                          placeholder="O que quer?"
                          data-textarea
                          onKeyDown={handleOnKeyPress}
                          onChange={({ currentTarget }) => {
                            if (currentTarget.value.length > 1000) {
                              return;
                            }

                            setPrompt(currentTarget.value);
                            if (currentTarget.scrollHeight < 100) {
                              currentTarget.style.height = "auto";
                              currentTarget.style.height = `${currentTarget.scrollHeight}px`;
                            }
                          }}
                        ></textarea>
                      </label>
                      <div className="control">
                        <div className="textBtn" onClick={HandleSendMessage}>
                          ctrl + enter
                        </div>
                      </div>
                    </div>
                    <span className="seperator"></span>
                    {selectChat?.messages.length > 0 && (
                      <div className="messages" ref={messagesRef}>
                        {selectChat?.messages.map((message, i) => {
                          if (message.role === "user") {
                            return (
                              <div className="my" key={(message?.content ?? "").slice(0, 10) + i}>
                                <MarkdownPreview
                                  source={message.content}
                                  style={{
                                    fontSize: "16px",
                                    backgroundColor: "transparent",
                                    accentColor: "#620FEA",
                                    lightingColor: "#620FEA",
                                    color: "#F8F9FA",
                                    colorAdjust: "exact",
                                    colorInterpolation: "sRGB",
                                    colorRendering: "optimizeQuality",
                                    colorScheme: "dark",
                                  }}
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div
                                className="daijin"
                                key={(message?.content ?? "").slice(0, 10) + i}
                              >
                                <MarkdownPreview
                                  source={message.content}
                                  style={{
                                    fontSize: "16px",
                                    backgroundColor: "transparent",
                                    accentColor: "#620FEA",
                                    lightingColor: "#620FEA",
                                    color: "#F8F9FA",
                                    colorAdjust: "exact",
                                    colorInterpolation: "sRGB",
                                    colorRendering: "optimizeQuality",
                                    colorScheme: "dark",
                                  }}
                                />
                              </div>
                            );
                          }
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <NotTokenAllowed />
        )}
      </div>
    </div>
  );
}

export default App;
