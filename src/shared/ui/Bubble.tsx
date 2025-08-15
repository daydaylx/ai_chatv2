import clsx from "clsx";

export default function Bubble({
  role,
  children,
  timestamp
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
  timestamp?: number;
}) {
  return (
    <div className={clsx("flex", role === "user" ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "bubble max-w-[85%] md:max-w-[70%] px-4 py-3",
          role === "user" ? "bubble-user ml-8" : "bubble-assistant mr-8"
        )}
      >
        <div className="space-y-2">{children}</div>
        {timestamp ? (
          <div className={clsx("mt-2 text-[11px] opacity-70", role === "user" ? "text-right text-white" : "")}>
            {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        ) : null}
      </div>
    </div>
  );
}
