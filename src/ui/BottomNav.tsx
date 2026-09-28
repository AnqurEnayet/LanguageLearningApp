import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Chapters", icon: "📖" },
  { to: "/revise", label: "Revise", icon: "🔁" },
  { to: "/words", label: "Words", icon: "🔤" },
  { to: "/settings", label: "Settings", icon: "⚙️" }
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          <span className="nav-icon" aria-hidden>
            {item.icon}
          </span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
