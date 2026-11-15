import { useTranslation } from "../../../i18n";
export function StepIllustration({ variant }) {
  return (
    <svg className="step-art" viewBox="0 0 200 180" aria-hidden="true">
      <circle cx="102" cy="86" r="66" fill="#bdeefa" />
      <path d="M40 117q61-42 126 0l-5 14q-69 35-122-1Z" fill="#6ed4b0" />
      <circle cx="130" cy="33" r="17" fill="#ffdf54" />
      <path d="M39 76h24q-7-16-15-3-9-4-9 3m95-17h28q-8-17-17-4-11-5-11 4" fill="white" />
      {variant === "luggage" ? (
        <>
          <path d="M55 58V35q0-15 15-15t15 15v25" fill="none" stroke="#71839e" strokeWidth="6" />
          <rect x="39" y="51" width="64" height="94" rx="17" fill="#5c667b" />
          <rect x="50" y="61" width="43" height="73" rx="10" fill="#7a849a" />
          <path d="M59 73v48m11-48v48m11-48v48" stroke="#536078" strokeWidth="3" />
          <circle cx="53" cy="146" r="6" fill="#303c52" /><circle cx="90" cy="146" r="6" fill="#303c52" />
          <path d="m105 82 48-18 13 59-47 18Z" fill="#fffbdf" />
          <path d="m110 87 11 45 32-12-10-44-9 25-12-5Z" fill="#32c7cc" />
          <path d="m119 90 11 19 20-4m-16-26-5 43" fill="none" stroke="#9ce4c2" strokeWidth="5" />
          <path d="M130 69s-13-12-13-22a13 13 0 0 1 26 0c0 10-13 22-13 22Z" fill="#ff7784" />
          <circle cx="130" cy="47" r="5" fill="white" />
          <ellipse cx="103" cy="149" rx="68" ry="9" fill="#f5d675" />
          <path d="m92 133 18-4 6 18-20 3Z" fill="#ffb342" /><path d="m94 137 18-4" stroke="#ed8e28" strokeWidth="2" />
          <path d="m126 134 5-21 9 2-2 21" fill="#ffcf52" />
        </>
      ) : variant === "beach" ? (
        <>
          <ellipse cx="100" cy="140" rx="73" ry="15" fill="#f4d576" />
          <path d="m123 44-13 95" stroke="#a87d47" strokeWidth="5" />
          <path d="M63 60q50-68 106 12Z" fill="#ff796f" />
          <path d="M63 60q56-69 60-16L99 66Z" fill="#ffdd68" />
          <path d="M123 44q38-8 46 28l-27-4Z" fill="#ffcf56" />
          <path d="m61 99 39 16-30 20-31-5Z" fill="#12b6cd" />
          <path d="m48 132-7 13m29-12 3 15m-12-46-10-15" stroke="#2486a6" strokeWidth="4" />
          <path d="m116 119 33-17-6 32-30 0Z" fill="#0e94b1" /><path d="m117 119 30-12-4 23-25 1Z" fill="#f7fcfb" />
          <path d="M38 111q-7-55 18-44-18 16-18 44m0 0q5-64-18-53 18 20 18 53" fill="#35bb9e" />
          <path d="m88 135 20-1 5 12-26 0Z" fill="#ff826f" />
          <path d="m145 138 9-22 8 3-5 22" fill="#ffcc5a" />
        </>
      ) : (
        <>
          <path d="M157 77q-18-21-28-6 19-2 28 6m0 0q-1-33 15-29-13 13-15 29m0 0q20-18 28-6-15-4-28 6" fill="#279b70" />
          <path d="m157 76-8 53" stroke="#ae9059" strokeWidth="5" />
          <path d="m90 77 30 7-5 49H91Z" fill="#faefbd" />
          <path d="m100 84 8-23 22-4" fill="none" stroke="#ed6e6d" strokeWidth="5" />
          <path d="M54 113q51-29 94-1-4 49-47 49t-47-48Z" fill="#95612f" />
          <ellipse cx="101" cy="113" rx="47" ry="16" fill="#fff3c8" />
          <ellipse cx="101" cy="114" rx="34" ry="8" fill="#c4dfb1" />
          <path d="m83 105 9-43" stroke="#7c6748" strokeWidth="3" />
          <path d="m52 73 45-26 33 35Z" fill="#ff6d69" /><path d="m97 47-10 35-35-9Z" fill="#ff9a76" />
          <path d="m142 131-20 19m-55-24 19 23" stroke="#ab743d" strokeWidth="3" />
        </>
      )}
    </svg>
  );
}

function SeatedReader({ x, y, shirt, scale = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M18 8q-5-33 17-34 29-2 22 36l-11 16Z" fill="#134a48" />
      <ellipse cx="36" cy="0" rx="12" ry="17" fill="#f4c3a3" />
      <path d="m28 12 18 0 15 70-48 0Z" fill={shirt} />
      <path d="m18 35-14 37 31 10m15-48 17 27-29 12" fill="none" stroke="#f4c3a3" strokeWidth="10" strokeLinecap="round" />
      <path d="m18 83 47 0 20 64-17 0-24-45-14 0 9 46H21L8 98Z" fill="#185953" />
      <path d="m20 147 20 0 3 9H16Zm48 0 19 0 8 9H66Z" fill="#163c3c" />
      <path d="m16 49 21 6 19-8 3 32-22 6-20-7Z" fill="#edb94e" />
      <path d="m37 55 1 28" stroke="#fff0bd" strokeWidth="2" />
      <path d="M25-12q-7 13-12 10 0-31 19-31 29-1 26 30-17-12-19-24Z" fill="#134a48" />
    </g>
  );
}

export function PlanningIllustration() {
  const { t } = useTranslation();
  return (
    <svg className="plan-stay-art" viewBox="0 0 640 460" role="img" aria-label={t("Travelers reading on a colorful stack of books")}>
      <path d="M70 320C8 196 64 60 195 60s100 35 213 28 204 65 182 180-99 126-218 119S124 429 70 320Z" fill="#ffb7c2" />
      <g fill="none" stroke="#ec8399" strokeWidth="8" strokeLinecap="round"><path d="M521 379q-32-140 31-246m-28 176q-45-76-19-133m25 77q28-72 58-77m-59 149q38-54 61-59M99 362q-10-68-35-91m35 65q25-24 16-55" /></g>
      <g stroke="#087e82" strokeWidth="8" strokeLinejoin="round">
        <path d="M143 340h309v55H143Z" fill="#fff2ce" /><path d="M143 340h320m-320 55h320" />
        <path d="M161 285h267v55H161Z" fill="#fff5db" /><path d="M161 285h280m-119 27h105" stroke="#e99685" />
        <path d="M129 230h309v55H129Z" fill="#f5ead5" /><path d="M129 230h322m-322 55h322" />
        <path d="M166 185h244v45H166Z" fill="#fff6e2" />
      </g>
      <g stroke="#d0c4a3" strokeWidth="2"><path d="M163 354h270m-270 10h270m-270 10h270m-243-75h217m-217 13h110m-167-66h290m-290 11h290m-290 11h290m-251-69h220m-220 12h220" /></g>
      <SeatedReader x={192} y={56} shirt="#b6d8bb" scale={0.9} />
      <SeatedReader x={355} y={88} shirt="#f36d86" scale={0.95} />
      <SeatedReader x={413} y={298} shirt="#f9d850" scale={0.76} />
      <path d="m511 371 52 0-12 65h-31Z" fill="#2bbca4" />
      <path d="M538 374q-26-60-15-106 25 31 15 106m0 0q7-70 37-94 8 51-37 94" fill="#0d998b" />
      <ellipse cx="106" cy="422" rx="58" ry="9" fill="#1c6c68" /><path d="M68 367h66l-7 44q-24 20-50 0Z" fill="#195b59" /><ellipse cx="101" cy="368" rx="33" ry="8" fill="#f8f1d6" /><path d="M69 376q-41-3-22 30 12 11 28 0" fill="none" stroke="#195b59" strokeWidth="8" />
    </svg>
  );
}
