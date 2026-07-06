import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { CiStar } from 'react-icons/ci';
import { MdOutlineCancel } from 'react-icons/md';
import { TooltipComponent } from '@syncfusion/ej2-react-popups';

import { links } from '../data/dummy';
import { useStateContext } from '../contexts/ContextProvider';

const Sidebar = () => {
  const { currentColor, activeMenu, setActiveMenu, screenSize } = useStateContext();

  const handleCloseSideBar = () => {
    if (activeMenu !== undefined && screenSize <= 900) {
      setActiveMenu(false);
    }
  };

  const activeLink = 'flex items-center gap-4 pl-4 py-3 rounded-lg text-white text-sm w-full shadow-sm';
  const normalLink = 'flex items-center gap-4 pl-4 py-3 rounded-lg text-sm text-slate-700 dark:text-gray-200 hover:bg-slate-100 dark:hover:bg-slate-700 w-full';

  return (
    <div className="h-full flex flex-col overflow-auto rounded-[20px] bg-white dark:bg-[#0b1220] p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
      {activeMenu && (
        <>
          <div className="flex items-center justify-between mb-6">
            <Link to="/" onClick={handleCloseSideBar} className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
                <CiStar />
              </div>
              <span>OCP</span>
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
                <div className="rounded-[16px] bg-slate-50 dark:bg-[#111827] p-2 space-y-2">
                  {item.links.map((link) => (
                    <NavLink
                      to={`/${link.name}`}
                      key={link.name}
                      onClick={handleCloseSideBar}
                      style={({ isActive }) => ({
                        backgroundColor: isActive ? currentColor : '',
                      })}
                      className={({ isActive }) => (isActive ? activeLink : normalLink)}
                    >
                      <span className="text-lg">{link.icon}</span>
                      <span className="capitalize">{link.name}</span>
                    </NavLink>
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
