// src/components/Sidebar.tsx
"use client";
import React from "react";
import { useRouter } from "next/navigation";

type SidebarProps = {
  setActivePage: React.Dispatch<React.SetStateAction<string>>;
  activePage: string;
};

const Sidebar = ({ setActivePage, activePage }: SidebarProps) => {
  const router = useRouter();

  return (
    <div className="bg-white text-gray-800 w-48 p-4 flex-shrink-0 shadow-lg hidden md:flex md:flex-col">
      <div className="flex items-center mb-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-pink-500"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M10 3.5a1.5 1.5 0 011.06.44l4.244 4.243a1.5 1.5 0 010 2.12l-4.244 4.243A1.5 1.5 0 0110 16.5v-2.5a.5.5 0 00-1 0v2.5a1.5 1.5 0 01-2.56.94l-4.244-4.243a1.5 1.5 0 010-2.12l4.244-4.243A1.5 1.5 0 019 3.5v2.5a.5.5 0 001 0V3.5z" />
        </svg>
        <h1 className="text-2xl font-bold ml-2">Korvin</h1>
      </div>
      <nav className="flex-1">
        <ul>
          <li>
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                setActivePage("inventory");
                router.push("/inventory");
              }}
              className={`flex items-center py-3 px-4 my-1 rounded-lg transition-colors duration-200 ${
                activePage === "inventory"
                  ? "bg-pink-100 text-pink-600"
                  : "hover:bg-gray-100"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <span className="ml-3">Inventory</span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
