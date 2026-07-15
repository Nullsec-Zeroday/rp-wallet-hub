"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

const TEAM_OPTIONS = [
  {
    id: "argentina",
    name: "Argentina",
    probability: 47,
    color: "#65b5e8",
  },
  {
    id: "england",
    name: "England",
    probability: 53,
    color: "#f5072d",
  },
] as const;

const CHAT_MESSAGES = [
  {
    avatar: "🎧",
    message: "Hey",
  },
  {
    avatar: "✨",
    message: "Argentina 4ever",
  },
  {
    avatar: "⚽",
    message: "Vamos",
  },
] as const;

function TeamFlag({ team, label }: { team: "argentina" | "england"; label: string }) {
  if (team === "argentina") {
    return (
      <span
        aria-label={`${label} flag`}
        role="img"
        className="relative flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[#69b3df]"
      >
        <span className="absolute inset-x-0 top-[10px] h-[10px] bg-white" />
        <span className="relative z-10 size-[5px] rounded-full bg-[#f4bd2d] ring-1 ring-[#d59f16]" />
      </span>
    );
  }

  return (
    <span
      aria-label={`${label} flag`}
      role="img"
      className="relative size-[30px] shrink-0 overflow-hidden rounded-[9px] bg-[#f7f7f7]"
    >
      <span className="absolute inset-y-0 left-[12px] w-[6px] bg-[#e9082d]" />
      <span className="absolute inset-x-0 top-[12px] h-[6px] bg-[#e9082d]" />
    </span>
  );
}

function MatchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-10 shrink-0"
      viewBox="0 0 120 120"
      fill="none"
    >
      <defs>
        <clipPath id="predict-match-tile">
          <path d="M35 0H84C107 0 120 13 120 36V84C120 107 107 120 84 120H36C13 120 0 107 0 84V36C0 13 13 0 35 0Z" />
        </clipPath>
        <clipPath id="predict-match-ball">
          <circle cx="60" cy="60" r="30" />
        </clipPath>
      </defs>

      <g clipPath="url(#predict-match-tile)">
        <rect width="120" height="120" fill="#75ADD8" />
        <path d="M0 0H112L0 112V0Z" fill="#DF092B" />
        <path d="M-3 116 115-2" stroke="#171717" strokeWidth="8" />
      </g>

      <g clipPath="url(#predict-match-ball)">
        <circle cx="60" cy="60" r="30" fill="#050505" />

        <path d="m49 31 11-4 11 4 2 11-7 8H54l-7-8 2-11Z" fill="white" />
        <path d="m31 48 9-7 10 3 5 10-4 11-11 4-9-7V48Z" fill="white" />
        <path d="m69 44 10-3 9 7v14l-9 7-11-4-4-11 5-10Z" fill="white" />
        <path d="m40 70 11-3 8 8-1 12-10 6-11-5-3-11 6-7Z" fill="white" />
        <path d="m69 67 11 3 6 7-3 11-11 5-10-6-1-12 8-8Z" fill="white" />

        <path d="m60 48 10 7-4 12H54l-4-12 10-7Z" fill="#050505" />
      </g>
      <circle cx="60" cy="60" r="30" stroke="#050505" strokeWidth="3" />
    </svg>
  );
}

function HapticButton({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(8);
        onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export default function PredictPage() {
  const [selectedTeam, setSelectedTeam] = React.useState<string | null>(null);

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col px-5 pb-36 pt-0">
      <section aria-labelledby="featured-heading" className="flex flex-col gap-[9px] pb-[38px]">
        <button
          type="button"
          className="flex w-fit items-center gap-1 text-left active:opacity-60"
        >
          <h1
            id="featured-heading"
            className="font-semibold tracking-[-0.025em] text-[#f5f5f5]"
            style={{ fontSize: 24, lineHeight: "29px" }}
          >
            Featured
          </h1>
          <ChevronRight aria-hidden="true" className="mt-0.5 text-[#b6b6ba]" size={23} strokeWidth={2.2} />
        </button>

        <article className="flex flex-col rounded-[25px] border border-[#242424] bg-[#191919] px-5 pb-[17px] pt-[18px]">
          <p className="text-[17px] font-semibold tracking-[-0.01em] text-[#a8a8ad]">World Cup</p>

          <div className="flex flex-col gap-3 pt-1">
            {TEAM_OPTIONS.map((team) => (
              <div key={team.id} className="flex items-center gap-3">
                <TeamFlag team={team.id} label={team.name} />
                <span className="text-[25px] font-semibold leading-none tracking-[-0.025em] text-[#f4f4f5]">
                  {team.name}
                </span>
              </div>
            ))}
          </div>

          <time dateTime="2026-07-16T00:30:00+05:30" className="pt-[10px] text-[18px] leading-none tracking-[-0.01em] text-[#aaa9ad]">
            16 Jul 2026 · 12:30 AM IST
          </time>

          <div aria-label="Win probability" className="flex gap-1 pt-[13px]">
            {TEAM_OPTIONS.map((team) => (
              <span
                key={team.id}
                className="h-[9px] rounded-full"
                style={{ backgroundColor: team.color, flex: team.probability }}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-[11px]">
            {TEAM_OPTIONS.map((team) => {
              const selected = selectedTeam === team.id;
              return (
                <HapticButton
                  key={team.id}
                  onClick={() => setSelectedTeam(selected ? null : team.id)}
                  className={`h-9 rounded-full border text-[17px] font-medium tabular-nums transition-all active:scale-[0.97] ${
                    selected
                      ? "border-[#ab9ff2] bg-[#ab9ff2] text-black"
                      : "border-[#292929] bg-[#202020] text-[#aaa9ad]"
                  }`}
                >
                  {team.probability}%
                </HapticButton>
              );
            })}
          </div>
        </article>
      </section>

      <section aria-labelledby="upcoming-heading" className="flex flex-col gap-0.5 pb-9">
        <h2 id="upcoming-heading" className="text-[24px] font-semibold tracking-[-0.025em] text-[#f5f5f5]">
          Upcoming
        </h2>

        <div className="-mx-5 flex snap-x gap-3 overflow-x-auto px-6 pb-1 no-scrollbar">
          <HapticButton className="flex h-[130px] w-[229px] shrink-0 snap-start flex-col items-start justify-between rounded-[25px] border border-[#242424] bg-[#191919] p-5 text-left transition-transform active:scale-[0.98]">
            <MatchIcon />
            <div className="flex flex-col gap-1">
              <span className="text-[19px] font-semibold tracking-[-0.02em] text-[#f1f1f2]">England vs Argentina</span>
              <span className="text-[17px] text-[#aaa9ad]">in 3h</span>
            </div>
          </HapticButton>
        </div>
      </section>

      <section aria-labelledby="chat-heading" className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <h2 id="chat-heading" className="min-w-0 truncate text-[24px] font-semibold tracking-[-0.03em] text-[#f5f5f5]">
            France vs. Spain Chat
          </h2>
          <div className="flex shrink-0 items-center gap-2 text-[17px] text-[#dedee0]">
            <span aria-hidden="true" className="size-[7px] rounded-full bg-[#00e76a]" />
            <span>3 chatting</span>
          </div>
        </div>

        <button
          type="button"
          className="relative h-[135px] overflow-hidden rounded-[25px] border border-[#242424] bg-[#191919] px-5 py-4 text-left active:scale-[0.99]"
        >
          <div className="flex flex-col gap-5">
            {CHAT_MESSAGES.map((chat) => (
              <div key={chat.message} className="flex items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#8e87b7] text-[14px] leading-none">
                  {chat.avatar}
                </span>
                <p className="min-w-0 text-[16px] leading-6 text-[#aaa9ad]">{chat.message}</p>
              </div>
            ))}
          </div>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#191919] to-transparent"
          />
        </button>
      </section>
    </div>
  );
}
