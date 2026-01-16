import {
  LayoutDashboard,
  Users,
  BookPlus,
  BookUp,
  Library,
  ArrowRightLeft,
  FolderOpen,
  Github,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import { useSidebar } from "../contexts/SidebarContext";

const Sidebar = () => {
  const { pathname } = useLocation();
  const { isSidebarOpen, closeSidebar } = useSidebar();

  const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/" },
    { label: "Members", icon: Users, path: "/members" },
    { label: "Book Collection", icon: Library, path: "/books" },
    { label: "Add Books", icon: BookPlus, path: "/add-books" },
    { label: "Check-out Books", icon: BookUp, path: "/checkout" },
  ];

  const socialLinks = [
    {
      label: "GitHub",
      url: "https://github.com/buildwithtausif",
      icon: "github",
    },
    {
      label: "Bluesky",
      url: "https://bsky.app/profile/buildwithtausif.bsky.social",
      icon: "bluesky",
    },
    {
      label: "Twitter",
      url: "https://twitter.com/buildwithtausif",
      icon: "twitter",
    },
    {
      label: "LinkedIn",
      url: "https://linkedin.com/in/buildwithtausif",
      icon: "linkedin",
    },
  ];

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 1024) {
      closeSidebar();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "h-screen w-64 bg-slate-900 border-r border-slate-800 text-white flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300",
          // Mobile: slide in from left
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible
          "lg:translate-x-0"
        )}
      >
        {/* Mobile Close Button */}
        <button
          onClick={closeSidebar}
          className="absolute top-4 right-4 lg:hidden text-slate-400 hover:text-white"
          aria-label="Close menu"
        >
          <X size={24} />
        </button>

        <div className="h-16 lg:h-20 flex items-center px-4 lg:px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-green-500">
            <BookPlus size={20} className="lg:w-6 lg:h-6" />
            <span className="text-lg lg:text-xl font-bold text-white">
              Library OS
              <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                demo
              </span>
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 lg:p-4 space-y-1 lg:space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={clsx(
                "flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-sm font-medium transition-colors",
                pathname === item.path
                  ? "bg-green-500/10 text-green-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon size={18} className="lg:w-5 lg:h-5" />
              {item.label}
            </Link>
          ))}

          <div className="pt-3 lg:pt-4 mt-3 lg:mt-4 border-t border-slate-800">
            <Link
              to="/transactions"
              onClick={handleLinkClick}
              className={clsx(
                "flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-sm font-medium transition-colors",
                pathname === "/transactions"
                  ? "bg-green-500/10 text-green-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <ArrowRightLeft size={18} className="lg:w-5 lg:h-5" />
              Active Loans
            </Link>
            <Link
              to="/inventory"
              onClick={handleLinkClick}
              className={clsx(
                "flex items-center gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg text-sm font-medium transition-colors",
                pathname === "/inventory"
                  ? "bg-green-500/10 text-green-500"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <FolderOpen size={18} className="lg:w-5 lg:h-5" />
              Inventory
            </Link>
          </div>
        </nav>

        <div className="p-3 lg:p-4 border-t border-slate-800">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 lg:mb-3">
            Connect
          </div>
          <div className="flex items-center justify-around">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors p-1.5 lg:p-2 hover:bg-slate-800 rounded-lg"
                title={social.label}
              >
                {social.icon === "github" && (
                  <Github size={16} className="lg:w-[18px] lg:h-[18px]" />
                )}
                {social.icon === "bluesky" && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="lg:w-[18px] lg:h-[18px]"
                  >
                    <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.271 7.733 4.308 4.267-4.308 1.172-6.498-2.74-7.078a8.741 8.741 0 01-.415-.056c.14.017.279.036.415.056 2.67.297 5.568-.628 6.383-3.364.246-.828.624-5.79.624-6.478 0-.69-.139-1.861-.902-2.206-.659-.298-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z" />
                  </svg>
                )}
                {social.icon === "twitter" && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="lg:w-[18px] lg:h-[18px]"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                )}
                {social.icon === "linkedin" && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="lg:w-[18px] lg:h-[18px]"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
