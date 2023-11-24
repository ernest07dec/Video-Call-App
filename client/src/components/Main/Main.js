import React, { useRef, useState, useEffect } from 'react';
import styled from 'styled-components';
import socket from '../../socket';
import { useNavigate } from 'react-router-dom';

const Main = () => {
  const navigate = useNavigate()
  const [userName, setUserName]= useState('')
  const [roomName, setRoomName]= useState('')
  const [err, setErr] = useState(false);
  const [errMsg, setErrMsg] = useState('');


    socket.on('FE-error-user-exist', ({ error }) => {
      if (!error) {
        sessionStorage.setItem('user', userName);
        navigate(`/room/${roomName}`);
      } else {
        setErr(error);
        setErrMsg('User name already exist');
      }
    });

  function clickJoin() {
    if (roomName.trim()==='' || userName.trim() ==='') {
      setErr(true);
      setErrMsg('Enter Room Name or User Name');
    } else {
      socket.emit('BE-check-user', { roomId: roomName, userName });
    }
  }

  return (
    <div>
      <div>
        <label htmlFor="roomName">Room Name</label>
        <input type="text" id="roomName" onChange={(e)=>setRoomName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="userName">User Name</label>
        <input type="text" id="userName" onChange={(e)=>setUserName(e.target.value)} />
      </div>
      <button onClick={clickJoin}> Join </button>
      {err ? <span>{errMsg}</span> : null}
    </div>
  );
};


export default Main;
