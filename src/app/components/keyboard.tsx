"use client";

import { useState, useEffect } from "react";

import Emitter from "../utils/emitter";

import { shifted, unshifted } from "../utils/keyboardLayout";
import { KeyReplay, playReplay } from "../utils/keyboardReplay";

export function Key({
  letter,
  onPress,
}: {
  letter: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  function keyDownHandler(e: KeyboardEvent) {
    if (e.key !== letter) return;

    onPress();
    setPressed(true);
  }

  function keyUpHandler(e: KeyboardEvent) {
    if (e.key !== letter) return;

    setPressed(false);
  }

  useEffect(() => {
    window.addEventListener("keydown", keyDownHandler);
    window.addEventListener("keyup", keyUpHandler);

    return () => {
      window.removeEventListener("keydown", keyDownHandler);
      window.removeEventListener("keyup", keyUpHandler);
    };
  }, [keyDownHandler, keyUpHandler]);

  return (
    <button
      className={`${pressed ? "bg-black text-white" : "bg-white text-black"} ${
        letter === " " ? "w-64" : "w-8"
      } text-base h-8 font-mono rounded-lg border transition-colors duration-100 cursor-default focus:outline-none`}
      tabIndex={-1}
    >
      {letter}
    </button>
  );
}

export default function Keyboard() {
  const [replay, setReplay] = useState<KeyReplay>([]);
  const [shifting, setShifting] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);

  function recordKeyPress(event: KeyboardEvent) {
    event.preventDefault();

    if (event.key === "r" && event.ctrlKey) {
      setRecording(false);
      setPlaying(true);

      playReplay(replay, {
        onComplete: () => {
          setPlaying(false);
        },
      });

      window.removeEventListener("keydown", recordKeyPress);
      window.removeEventListener("keyup", recordKeyPress);

      return;
    }

    const shift = event.shiftKey;
    const caps = event.getModifierState("CapsLock");

    setReplay((p) => [
      ...p,
      {
        key: event.key,
        modifiers: { shift, caps },
        time: Date.now(),
        type: event.type as "keydown" | "keyup",
      },
    ]);
  }

  function checkKeyboardState(e: KeyboardEvent) {
    if (e.shiftKey !== shifting) setShifting(e.shiftKey);
    if (e.getModifierState("CapsLock") !== capsLock)
      setCapsLock(e.getModifierState("CapsLock"));
    if (e.key === "r" && e.ctrlKey) {
      e.preventDefault();

      if (recording) return;

      setRecording(true);
      setReplay([]);

      window.addEventListener("keydown", recordKeyPress);
      window.addEventListener("keyup", recordKeyPress);
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", checkKeyboardState);
    window.addEventListener("keyup", checkKeyboardState);

    return () => {
      window.removeEventListener("keydown", checkKeyboardState);
      window.removeEventListener("keyup", checkKeyboardState);
    };
  }, [checkKeyboardState]);

  return (
    <div
      className={`${
        playing ? "opacity-50" : ""
      } flex sticky bottom-16 flex-col gap-1 items-center transition-opacity`}
    >
      {(shifting ? shifted : unshifted).map((row, i) => (
        <div className="flex gap-1" key={i}>
          {row.map((key) => (
            <Key
              key={key}
              letter={!capsLock ? key : key.toUpperCase()}
              onPress={() => Emitter.emit("keyPress", key)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
