import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ImLeaf } from "react-icons/im";
import { MdOutlineCancel } from 'react-icons/md';
import { PiCaretDoubleDownThin } from 'react-icons/pi';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';

import { links } from '../data/dummy';
import { useStateContext } from '../contexts/ContextProvider';

const Sidebar = () => {
  const { currentColor, activeMenu, setActiveMenu, screenSize } = useStateContext();
  
  // Track open state for dropdown menus (e.g. { 'Tickets': true })
  const [openDropdowns, setOpenDropdowns] = useState({ Tickets: true });

  const toggleDropdown = (name) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  const handleCloseSideBar = () => {
    if (activeMenu !== undefined && screenSize <= 900) {
      setActiveMenu(false);
    }
  };

  const activeLink = 'flex items-center gap-4 pl-4 py-3 rounded-lg text-white text-sm w-full shadow-sm';
  const normalLink = 'flex items-center gap-4 pl-4 py-3 rounded-lg text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 w-full transition duration-150';
  
  const activeSubLink = 'flex items-center gap-3 pl-10 py-2.5 rounded-lg text-sm font-semibold text-white w-full shadow-sm';
  const normalSubLink = 'flex items-center gap-3 pl-10 py-2.5 rounded-lg text-sm text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 w-full transition duration-150';

  return (
    <div className="h-full flex flex-col overflow-auto rounded-xl bg-white dark:bg-[#0b1220] p-4 shadow-lg">
      {activeMenu && (
        <>
          <div className="flex items-center justify-between mb-6">
            <Link to="/" onClick={handleCloseSideBar} className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white">
                <ImLeaf />
              </div>
              <span>OCP Dash</span>
            </Link>
            <TooltipComponent content="Menu" position="BottomCenter">
              <button
                type="button"
                onClick={() => setActiveMenu(!activeMenu)}
                style={{ color: currentColor }}
                className="block md:hidden text-xl rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <MdOutlineCancel />
              </button>
            </TooltipComponent>
          </div>
          <div className="flex-1 overflow-auto">
            {links.map((item) => (
              <div key={item.title} className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1 mb-3">{item.title}</p>
                <div className="rounded-[16px] bg-white dark:bg-[#111827] p-2 space-y-2">
                  {item.links.map((link) => (
                    <div key={link.name}>
                      {link.isDropdown ? (
                        /* --- DROPDOWN HEADER --- */
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleDropdown(link.name)}
                            className={normalLink}
                          >
                            <span className="text-lg">{link.icon}</span>
                            <span className="capitalize font-medium flex-1 text-left">{link.name}</span>
                            <PiCaretDoubleDownThin
                              className={`text-xs text-gray-400 transition-transform duration-200 mr-2 ${
                                openDropdowns[link.name] ? 'rotate-180' : ''
                              }`}
                            />
                          </button>

                          {/* --- SUB ITEMS --- */}
                          {openDropdowns[link.name] && (
                            <div className="space-y-1 mt-1">
                              {link.subItems?.map((subItem) => (
                                <NavLink
                                  to={`/${subItem.path}`}
                                  key={subItem.path}
                                  onClick={handleCloseSideBar}
                                  style={({ isActive }) => ({
                                    backgroundColor: isActive ? currentColor : '',
                                  })}
                                  className={({ isActive }) => (isActive ? activeSubLink : normalSubLink)}
                                >
                                  <span className="capitalize">{subItem.name}</span>
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* --- REGULAR SINGLE LINK --- */
                        <NavLink
                          to={`/${link.name}`}
                          onClick={handleCloseSideBar}
                          style={({ isActive }) => ({
                            backgroundColor: isActive ? currentColor : '',
                          })}
                          className={({ isActive }) => (isActive ? activeLink : normalLink)}
                        >
                          <span className="text-lg">{link.icon}</span>
                          <span className="capitalize">{link.name}</span>
                        </NavLink>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;