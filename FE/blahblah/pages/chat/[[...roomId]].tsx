/* eslint-disable */
import { useState, useRef, useEffect } from "react";
import Image from "react-bootstrap/Image";
import {
  styled,
  TextField,
  IconButton,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  Stack,
  CircularProgress,
} from "@mui/material";
// icons
import ReportIcon from "@mui/icons-material/Report";
import VideocamIcon from "@mui/icons-material/Videocam";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import CallEndIcon from "@mui/icons-material/CallEnd";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DownloadIcon from "@mui/icons-material/Download";
// components
import ChatList from "../../component/chat/chatList";
import ChatTabs from "../../component/chat/chatTabs";
import RecorderDialog from "../../component/recorder/recoderDialog";
import ImageDialog from "../../component/imageModal/imageDialog";
import ChatBoxOfOther from "../../component/chat/chatBoxOfOther";
import CorrectMessage from "../../component/chat/correctMessage";
import VoiceSaveDialog from "../../component/chat/voiceSaveDialog";
// chat websocket
import { Stomp } from "@stomp/stompjs";
import SockJS from "sockjs-client";
// axios
import axios from "axios";
// video call
import { WebRtcPeer } from "kurento-utils";
// router
import { useRouter } from "next/router";

const ChatTypographyByMe = styled(Typography)({
  borderRadius: "20px",
  padding: "10px 20px",
  backgroundColor: "skyblue",
  color: "white",
  fontWeight: 500,
});

const ChatBox = styled(Box)({
  overflowY: "auto",
  height: "100%",
  width: "100%",
  display: "flex",
  flexDirection: "column",
});

let stompClient: any = null;

let ws: any = null;

let webRtcPeer: any = null;

let videoInput: any;
let videoOutput: any;

var constraints: any = {
  audio: true,
  video: true,
};

let from: any;

export default function Chat() {
  const router = useRouter();
  // 로그인한 유저의 정보
  const [userData, setUserData] = useState<any>(null);
  // 채팅 히스토리(개별)
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  // 채팅 목록
  const [chattingList, setChattingList] = useState<any[]>([]);
  // 채팅방 정보(개별)
  const [chatRoomData, setChatRoomData] = useState<any>();
  // 채팅 상대방 이름
  const [chatname, setChatname] = useState("");

  // 라우터를 활용한 방번호 상태 저장
  const [routerRoomId, setRouterRoomId] = useState("");
  useEffect(() => {
    if (router.query.roomId !== undefined) {
      setRouterRoomId(router.query.roomId[0]);
    }
  }, [router.query]);

  // 라우터 쿼리 체크
  useEffect(() => {
    if (router.query.userId !== undefined) {
      axios({
        url: `https://blahblah.community:8080/api/chat/${router.query.userId}`,
        method: "get",
        headers: setToken(),
      })
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          if (err.response.status === 404) {
            axios({
              url: "https://blahblah.community:8080/api/chat",
              method: "post",
              headers: setToken(),
              data: {
                opponentId: router.query.userId,
                opponentName: router.query.name,
              },
            })
              .then((res) => {
                console.log(res);
              })
              .catch((err) => {
                console.error(err);
              });
          }
        });
    }
  }, [router.query]);

  // 유저 정보 가져오기
  const setToken = () => {
    const token = localStorage.getItem("jwt");
    const config = {
      Authorization: `Bearer ${token}`,
    };
    return config;
  };

  const getProfile = () => {
    axios({
      url: "https://blahblah.community:8443/api/user/me",
      method: "get",
      headers: setToken(),
    })
      .then((res) => {
        setUserData(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    getProfile();
  }, []);

  // 채팅 웹소켓 연결
  const connect = () => {
    let socket = new SockJS("https://blahblah.community:8080/chat-websocket");

    stompClient = Stomp.over(socket);

    stompClient.connect({}, function (frame: any) {
      console.log("Connected:" + frame);
      // 채팅 목록 가져오기
      stompClient.subscribe("/topic/list/" + userData.id, function (msg: any) {
        let tmpMsg = JSON.parse(msg.body);
        console.log(tmpMsg);
        setChattingList(tmpMsg);
      });
      list();
      stompClient.subscribe("/topic/" + userData.id, function (msg: any) {
        updateLastRead();
        let tmpChat = JSON.parse(msg.body);
        console.log(tmpChat);
        console.log(tmpChat.roomId);
        addMsg(tmpChat);
      });
    });
  };

  useEffect(() => {
    if (userData) {
      connect();
    }
    return () => {
      if (stompClient) {
        stompClient.disconnect();
      }
    };
  }, [userData]);

  const addMsg = (msg: any) => {
    if (msg.roomId == routerRoomId) {
      setChatHistory((prev) => [...prev, msg]);
    }
  };
  // 채팅 히스토리
  useEffect(() => {
    console.log(chatRoomData);
    if (chatRoomData) {
      axios({
        method: "get",
        url: `https://blahblah.community:8080/api/message/${chatRoomData.roomId}`,
      })
        .then((res) => {
          console.log(res);
          setChatHistory(res.data);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [chatRoomData]);

  useEffect(() => {
    console.log(chatHistory);
  }, [chatHistory]);

  const updateLastRead = () => {
    console.log("list");
    const token = localStorage.getItem("jwt");
    if (stompClient) {
      stompClient.send(
        "chat/read/" + chatRoomData.opponentId,
        { Authorization: `Bearer ${token}` },
        JSON.stringify({})
      );
    }
  };

  const list = () => {
    console.log("list");
    const token = localStorage.getItem("jwt");
    if (token) {
      stompClient.send(
        "/chat/list",
        {
          Authorization: `Bearer ${token}`,
        },
        JSON.stringify({})
      );
    }
  };

  // type에 따라 채팅 보내기
  const sendMsg = (type: string, content: any) => {
    const token = localStorage.getItem("jwt");
    if (stompClient) {
      stompClient.send(
        "/chat/send/" + chatRoomData.opponentId + "/to-other",
        { Authorization: `Bearer ${token}` },
        JSON.stringify({
          type: type,
          senderId: userData.id,
          senderName: userData.name,
          roomId: chatRoomData.roomId,
          receiverId: chatRoomData.opponentId,
          receiverName: chatname,
          content: content,
        })
      );

      stompClient.send(
        "/chat/send/to-me",
        { Authorization: `Bearer ${token}` },
        JSON.stringify({
          type: type,
          senderId: userData.id,
          senderName: userData.name,
          roomId: chatRoomData.roomId,
          receiverId: chatRoomData.opponentId,
          receiverName: chatname,
          content: content,
        })
      );
      list();
    }
  };

  // 첨삭용 메시지 보내기 함수
  const sendCorrectMsg = (type: string, content: string, fixedMsg: string) => {
    const token = localStorage.getItem("jwt");
    if (stompClient) {
      stompClient.send(
        "/chat/send/" + chatRoomData.opponentId + "/to-other",
        { Authorization: `Bearer ${token}` },
        JSON.stringify({
          type: type,
          senderId: userData.id,
          senderName: userData.name,
          roomId: chatRoomData.roomId,
          receiverId: chatRoomData.opponentId,
          receiverName: chatname,
          content: content,
          comment: fixedMsg,
        })
      );

      stompClient.send(
        "/chat/send/to-me",
        { Authorization: `Bearer ${token}` },
        JSON.stringify({
          type: type,
          senderId: userData.id,
          senderName: userData.name,
          roomId: chatRoomData.roomId,
          receiverId: chatRoomData.opponentId,
          receiverName: chatname,
          content: content,
          comment: fixedMsg,
        })
      );
      list();
    }
  };

  const [message, setMessage] = useState<string>("");
  const handleMessage = (e: any) => {
    setMessage(e.target.value);
  };

  const chatRef = useRef<any>(null);

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  });

  const handleMessageList = () => {
    if (message) {
      sendMsg("text", message);
      setMessage("");
    } else {
      alert("메시지를 입력해주세요.");
    }
  };

  // recorder dialog 열고 닫기
  const [openRecorder, setOpenRecorder] = useState(false);
  const handleClickOpenRecorder = () => {
    setOpenRecorder(true);
  };

  const handleCloseRecorder = () => {
    setOpenRecorder(false);
  };

  // 채팅 첨삭
  const [correctMessage, setCorrectMessage] = useState("");

  // 채팅 번역
  const [translateMessage, setTranslateMessage] = useState("");
  const [translatedMessage, setTranslatedMessage] = useState("");
  const [languageList, setLanguageList] = useState([]);
  const handleTranslate = () => {
    axios({
      method: "post",
      url: "https://blahblah.community:8080/api/trans",
      data: {
        text: translateMessage,
        targetLanguage: targetLanguage,
      },
    })
      .then((res) => {
        console.log(res.data);
        setTranslatedMessage(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const getLanguageList = () => {
    axios({
      method: "get",
      url: "https://blahblah.community:8080/api/supportedLanguage/en",
    })
      .then((res) => {
        setLanguageList(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const [targetLanguage, setTargetLanguage] = useState("");
  const handleSelectLanguage = (e: SelectChangeEvent) => {
    setTargetLanguage(e.target.value);
  };

  useEffect(() => {
    getLanguageList();
  }, []);

  // 이미지 dialog 열고 닫기
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const handleClickOpenImageDialog = () => {
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const [callState, setCallState] = useState(false);

  const getAccessToken = async () => {
    try {
      const accessToken = await axios({
        method: "GET",
        url: "https://blahblah.community:9443/api/authentication/token",
        headers: setToken(),
      });
      const tokenData = accessToken.data;
      ws = new WebSocket(
        `wss://blahblah.community:9443/call?authentication=${tokenData}`
      );
      videoInput = document.getElementById("videoInput");
      videoOutput = document.getElementById("videoOutput");
      ws.onopen = function () {
        register(userData.name);
      };
      ws.onmessage = function (message: any) {
        let parsedMessage = JSON.parse(message.data);
        console.info("받은 메시지: " + message.data);
        switch (parsedMessage.id) {
          case "registerResponse":
            console.log(parsedMessage);
            break;
          case "callResponse":
            callResponse(parsedMessage);
            break;
          case "incomingCall":
            incomingCall(parsedMessage);
            break;
          case "startCommunication":
            startCommunication(parsedMessage);
            break;
          case "stopCommunication":
            console.log("Communication ended by remote peer");
            setCallState(false);
            stopCall(false);
            break;
          case "iceCandidate":
            webRtcPeer.addIceCandidate(
              parsedMessage.candidate,
              function (error: any) {
                if (error)
                  return console.error("Error adding candidate: " + error);
              }
            );
            break;
          default:
            console.error("Unrecognized message", parsedMessage);
        }
      };
      // return () => {
      //   ws.close();
      // };
    } catch (err) {
      console.error(err);
    }
  };

  // 화상회의를 위한 웹소켓 연결
  useEffect(() => {
    if (userData) {
      getAccessToken();
    }
  }, [userData]);

  function startCommunication(message: any) {
    webRtcPeer.processAnswer(message.sdpAnswer, function (error: any) {
      if (error) return console.error(error);
    });
  }

  const [calling, setCalling] = useState(true);
  function callResponse(message: any) {
    if (message.response != "accepted") {
      console.info("Call not accepted by peer. Closing call");
      var errorMessage = message.message
        ? message.message
        : "Unknown reason for call rejection.";
      console.log(errorMessage);
      alert("상대방이 통화를 거절했습니다...ㅜㅜ");
      stopCall(false);
      setCalling(true);
    } else {
      setCallState(true);
      setCalling(false);
      webRtcPeer.processAnswer(message.sdpAnswer, function (error: any) {
        if (error) return console.error(error);
      });
    }
  }

  function register(user: string) {
    let name = user;

    var message = {
      id: "register",
      name: name,
    };
    sendMessage(message);
  }

  function incomingCall(message: any) {
    if (confirm(message.from + "로부터 영상통화가 왔습니다. 받으시겠습니까?")) {
      from = message.from;
      let options = {
        localVideo: videoInput,
        remoteVideo: videoOutput,
        onicecandidate: onIceCandidate,
        mediaConstraints: constraints,
      };
      setCallState(true);
      setCalling(false);
      webRtcPeer = new (WebRtcPeer.WebRtcPeerSendrecv as any)(
        options,
        function (error: any) {
          if (error) {
            return console.error(error);
          }
          console.log("옵션: " + constraints.audio + "/" + constraints.video);
          webRtcPeer.generateOffer(onOfferIncomingCall);
        }
      );
    } else {
      let response = {
        id: "incomingCallResponse",
        from: message.from,
        callResponse: "reject",
        message: "user declined",
      };
      sendMessage(response);
      setCalling(true);
      stopCall(false);
    }
  }

  function onOfferIncomingCall(error: any, offerSdp: any) {
    if (error) return console.error("Error generating the offer");
    let response = {
      id: "incomingCallResponse",
      from: from,
      callResponse: "accept",
      sdpOffer: offerSdp,
    };
    sendMessage(response);
  }

  const onIceCandidate = (candidate: any) => {
    console.log("Local candidate" + JSON.stringify(candidate));
    let message = {
      id: "onIceCandidate",
      candidate: candidate,
    };
    sendMessage(message);
  };

  const sendMessage = (message: any) => {
    if (ws) {
      let jsonMessage = JSON.stringify(message);
      console.log("Video Sending Message: " + jsonMessage);
      ws.send(jsonMessage);
    }
  };

  const videoCall = () => {
    const options = {
      localVideo: videoInput,
      remoteVideo: videoOutput,
      onicecandidate: onIceCandidate,
      mediaConstraints: constraints,
    };
    webRtcPeer = new (WebRtcPeer.WebRtcPeerSendrecv as any)(options, function (
      error: any
    ) {
      if (error) {
        return console.error(error);
      }
      setCallState(true);
      webRtcPeer.generateOffer(onOfferCall);
    });
  };

  const onOfferCall = (error: any, offerSdp: any) => {
    if (error) return console.error("Error generating the offer");
    console.log("Invoking SDP offer callback function");
    let message = {
      id: "call",
      from: userData.name,
      to: chatname,
      sdpOffer: offerSdp,
    };
    sendMessage(message);
  };

  const stopCall = (message: any) => {
    if (webRtcPeer) {
      webRtcPeer.dispose();
      webRtcPeer = null;

      if (!message) {
        let message2 = {
          id: "stop",
        };
        sendMessage(message2);
      }
    }
    setCalling(true);
    setCallState(false);
  };

  const [audioMuted, setAudioMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);

  const muteAudio = () => {
    if (webRtcPeer) {
      webRtcPeer.getLocalStream().getAudioTracks()[0].enabled = !webRtcPeer
        .getLocalStream()
        .getAudioTracks()[0].enabled;
      setAudioMuted(!audioMuted);
    }
  };

  const muteVideo = () => {
    if (webRtcPeer) {
      webRtcPeer.getLocalStream().getVideoTracks()[0].enabled = !webRtcPeer
        .getLocalStream()
        .getVideoTracks()[0].enabled;
      setVideoMuted(!videoMuted);
    }
  };

  // 음성메시지파일 저장 기능
  const [openVoiceSave, setOpenVoiceSave] = useState(false);
  const [voiceMsgUrl, setVoiceMsgUrl] = useState("");

  const handleClickOpenVoiceSave = (voiceS3Url: any) => {
    setOpenVoiceSave(true);
    setVoiceMsgUrl(voiceS3Url);
  };

  const handleCloseVoiceSave = () => {
    setOpenVoiceSave(false);
  };

  return (
    <>
      <Box
        style={{
          height: "80vh",
          marginTop: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {chattingList && (
          <Box sx={{ width: "20%", display: callState ? "none" : "block" }}>
            <ChatList
              chattingList={chattingList}
              setChatname={setChatname}
              setChatRoomData={setChatRoomData}
            />
          </Box>
        )}
        <Stack
          sx={{
            width: "20%",
            display: callState ? "flex" : "none",
            alignItems: "center",
          }}
          spacing={2}
        >
          <Box>
            <video
              style={{ border: "1px solid black" }}
              autoPlay
              id="videoInput"
              width="240px"
              height="180px"
            />

            <video
              style={{
                border: "1px solid black",
                display: calling ? "none" : "block",
              }}
              autoPlay
              id="videoOutput"
              width="240px"
              height="180px"
            />
            <Box
              sx={{
                border: "1px solid black",
                width: "240px",
                height: "180px",
                display: calling ? "flex" : "none",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress />
            </Box>
            <Box>
              <IconButton onClick={() => stopCall(false)}>
                <CallEndIcon color="warning" />
              </IconButton>
              <Button onClick={muteAudio}>
                {audioMuted ? "음소거 해제" : "음소거"}
              </Button>
              <Button onClick={muteVideo}>
                {videoMuted ? "화면 켜기" : "화면 끄기"}
              </Button>
            </Box>
          </Box>
        </Stack>
        <Box
          sx={{
            display: "flex",
            border: "1px solid black",
            borderRadius: "10px",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            width: "50%",
          }}
        >
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              padding: 3,
              borderBottom: "1px solid black",
              justifyContent: "space-between",
            }}
          >
            <Typography>상대방: {chatname}</Typography>
            <Box>
              <IconButton onClick={videoCall}>
                <VideocamIcon sx={{ color: "black" }} />
              </IconButton>
              <IconButton
                onClick={() => {
                  alert("신고 버튼 눌림");
                }}
              >
                <ReportIcon color="warning" />
              </IconButton>
            </Box>
          </Box>
          <ChatBox ref={chatRef} className="chatbox-scroll">
            {userData &&
              (chatHistory.length > 0 ? (
                chatHistory.map((item, index) => {
                  if (item.senderId == userData.id) {
                    return (
                      <Box
                        sx={{
                          width: "100%",
                          padding: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "end",
                        }}
                        key={index}
                      >
                        {item.type === "text" && (
                          <ChatTypographyByMe>
                            {item.content}
                          </ChatTypographyByMe>
                        )}
                        {item.type === "audio" && (
                          <>
                            <IconButton
                              onClick={() => {
                                handleClickOpenVoiceSave(item.content);
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <audio
                              src={item.content}
                              controls
                              controlsList="nodownload"
                            />
                          </>
                        )}
                        {item.type === "image" && (
                          <Image
                            src={item.content}
                            style={{ width: "200px", height: "200px" }}
                          />
                        )}
                        {item.type === "comment" && (
                          <Stack
                            sx={{
                              borderRadius: "20px",
                              padding: "10px 20px",
                              backgroundColor: "skyblue",
                              fontWeight: 500,
                              color: "white",
                            }}
                          >
                            <Typography
                              sx={{
                                borderBottom: "1px solid white",
                                opacity: 0.5,
                              }}
                            >
                              기존: {item.content}
                            </Typography>
                            <Box sx={{ display: "flex" }}>
                              <ArrowForwardIcon />
                              <Typography>코멘트: {item.comment}</Typography>
                            </Box>
                          </Stack>
                        )}
                      </Box>
                    );
                  } else {
                    return (
                      <ChatBoxOfOther
                        key={index}
                        item={item}
                        type={item.type}
                        message={item.content}
                        setCorrectMessage={setCorrectMessage}
                        setTranslateMessage={setTranslateMessage}
                        handleClickOpenVoiceSave={handleClickOpenVoiceSave}
                      />
                    );
                  }
                })
              ) : (
                <Box>
                  <Typography>채팅을 시작하세요~</Typography>
                </Box>
              ))}
          </ChatBox>
          <Box
            sx={{
              borderTop: "1px solid black",
              width: "100%",
              height: "15%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {correctMessage && (
              <CorrectMessage
                sendCorrectMsg={sendCorrectMsg}
                correctMessage={correctMessage}
                setCorrectMessage={setCorrectMessage}
              />
            )}
            {translateMessage && languageList && (
              <Box sx={{ display: "flex" }}>
                <Typography>{translateMessage}</Typography>
                <Box sx={{ minWidth: 120 }}>
                  <FormControl fullWidth>
                    <InputLabel>Language</InputLabel>
                    <Select
                      label="언어"
                      onChange={handleSelectLanguage}
                      value={targetLanguage}
                    >
                      {languageList.map((item: any, index) => {
                        return (
                          <MenuItem key={index} value={item.code}>
                            {item.label}
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Box>
                <Button onClick={handleTranslate}>Translate!</Button>
                {translatedMessage && (
                  <Typography>{translatedMessage}</Typography>
                )}
                <IconButton
                  onClick={() => {
                    setTranslateMessage("");
                  }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            )}
            <Box>
              <TextField
                sx={{ width: "30vw" }}
                value={message}
                placeholder="Type your message."
                onChange={handleMessage}
                onKeyPress={(e: any) => {
                  if (e.key === "Enter") {
                    handleMessageList();
                  }
                }}
                variant="standard"
              />
              <IconButton onClick={handleMessageList}>
                <SendIcon color="primary" />
              </IconButton>
              <IconButton onClick={handleClickOpenRecorder}>
                <MicIcon sx={{ color: "black" }} />
              </IconButton>
              <IconButton onClick={handleClickOpenImageDialog}>
                <AttachFileIcon
                  sx={{ color: "black", transform: "rotate(45deg)" }}
                />
              </IconButton>
            </Box>
            <RecorderDialog
              openRecorder={openRecorder}
              setOpenRecorder={setOpenRecorder}
              handleCloseRecorder={handleCloseRecorder}
              sendMsg={sendMsg}
            />
            <ImageDialog
              openImageDialog={openImageDialog}
              setOpenImageDialog={setOpenImageDialog}
              handleCloseImageDialog={handleCloseImageDialog}
              sendMsg={sendMsg}
            />
            {voiceMsgUrl && (
              <VoiceSaveDialog
                voiceMsgUrl={voiceMsgUrl}
                openVoiceSave={openVoiceSave}
                handleCloseVoiceSave={handleCloseVoiceSave}
              />
            )}
          </Box>
        </Box>
        <ChatTabs />
      </Box>
    </>
  );
}