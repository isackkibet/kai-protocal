"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

export default function ChessGame() {
  const [isMounted, setIsMounted] = useState(false);
  const [game, setGame] = useState(new Chess());
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [status, setStatus] = useState("Your Turn");
  const [isGameOver, setIsGameOver] = useState(false);
  const [playerColor, setPlayerColor] = useState<"white" | "black">("white");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Helper to update game state
  function makeAMove(move: any) {
    const gameCopy = new Chess(game.fen());
    try {
      const result = gameCopy.move(move);
      if (result) {
        setGame(gameCopy);
        setMoveHistory(prev => [...prev, result.san]);
        return result;
      }
    } catch (e) {
      return null;
    }
    return null;
  }

  // AI Move (Simple Random/Heuristic)
  const makeRandomMove = useCallback(() => {
    if (game.isGameOver()) return;
    
    const possibleMoves = game.moves();
    if (possibleMoves.length === 0) return;
    
    // Simple AI: Prefer captures if available
    const captures = possibleMoves.filter(m => m.includes('x'));
    const chosenMove = captures.length > 0 
      ? captures[Math.floor(Math.random() * captures.length)]
      : possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    setTimeout(() => {
      makeAMove(chosenMove);
      setStatus("Your Turn");
    }, 1000);
  }, [game]);

  // Effect to handle game state changes
  useEffect(() => {
    if (game.isGameOver()) {
      setIsGameOver(true);
      if (game.isCheckmate()) setStatus("Checkmate! Computer Wins.");
      else if (game.isDraw()) setStatus("Draw!");
      else setStatus("Game Over");
      return;
    }

    if (game.turn() !== playerColor[0]) {
      setStatus("Computer Thinking...");
      makeRandomMove();
    }
  }, [game, playerColor, makeRandomMove]);

  function onDrop({ sourceSquare, targetSquare }: { sourceSquare: string, targetSquare: string }) {
    if (isGameOver || game.turn() !== playerColor[0]) return false;

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q", // always promote to queen for simplicity
    });

    if (move === null) return false;
    return true;
  }

  function resetGame() {
    setGame(new Chess());
    setMoveHistory([]);
    setStatus("Your Turn");
    setIsGameOver(false);
  }

  if (!isMounted) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT: Chess Board */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="bg-slate-800 p-4 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          
          <div className="max-w-[600px] mx-auto w-full aspect-square">
            <Chessboard 
              options={{
                position: game.fen(),
                onPieceDrop: onDrop as any,
                boardOrientation: playerColor,
                darkSquareStyle: { backgroundColor: "#1e293b" },
                lightSquareStyle: { backgroundColor: "#334155" },
                boardStyle: {
                  borderRadius: "4px",
                  boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
                }
              }}
            />
          </div>
          
          {/* Status Overlay */}
          <div className="mt-4 flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${game.turn() === 'w' ? 'bg-white shadow-[0_0_8px_white]' : 'bg-slate-600'}`} />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">White</span>
            </div>
            <div className="flex flex-col items-center">
               <span className={`text-sm font-black uppercase tracking-[0.2em] ${isGameOver ? 'text-rose-400' : 'text-primary'}`}>
                 {status}
               </span>
               {game.inCheck() && !game.isCheckmate() && (
                 <span className="text-[10px] text-rose-500 font-bold animate-pulse">CHECK!</span>
               )}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Black</span>
              <div className={`w-3 h-3 rounded-full ${game.turn() === 'b' ? 'bg-primary shadow-[0_0_8px_var(--primary)]' : 'bg-slate-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Stats & Controls */}
      <div className="space-y-6">
        
        {/* Session Stats */}
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Match Session</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Staked</div>
              <div className="text-xl font-black text-white">50.0</div>
              <div className="text-[9px] text-primary font-bold">SIHU CREDITS</div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Win Payout</div>
              <div className="text-xl font-black text-emerald-400">+45.0</div>
              <div className="text-[9px] text-emerald-500/50 font-bold tracking-tighter">ESTIMATED</div>
            </div>
          </div>

          <button 
            onClick={resetGame}
            className="w-full py-4 bg-slate-700 text-white font-black rounded-xl hover:bg-slate-600 transition-all border border-white/10 mb-3"
          >
            New Game
          </button>
          <button 
            disabled={isGameOver || moveHistory.length === 0}
            className="w-full py-2 text-slate-500 font-bold text-sm hover:text-white transition-colors disabled:opacity-20"
          >
            Resign Match
          </button>
        </div>

        {/* Move History */}
        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 flex flex-col h-[300px]">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Notation Log</h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                <React.Fragment key={i}>
                  <div className="text-xs flex justify-between">
                    <span className="text-slate-600 font-mono w-4">{i + 1}.</span>
                    <span className="text-slate-300 font-bold font-mono">{moveHistory[i * 2]}</span>
                  </div>
                  <div className="text-xs text-right">
                    <span className="text-slate-300 font-bold font-mono">{moveHistory[i * 2 + 1] || ""}</span>
                  </div>
                </React.Fragment>
              ))}
              {moveHistory.length === 0 && (
                <div className="col-span-2 text-center text-[10px] text-slate-600 italic py-12">
                  No moves recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
