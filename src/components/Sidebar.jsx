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

  const activeLink = 'flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-xl bg-slate-900 text-white text-md m-2';
  const normalLink = 'flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-xl text-md text-slate-600 hover:text-slate-900 dark:text-gray-200 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 m-2';

  return (
    <div className="ml-3 mt-3 h-screen md:overflow-hidden overflow-auto md:hover:overflow-auto bg-white dark:bg-secondary-dark-bg shadow-lg rounded-[20px] border border-slate-200 dark:border-slate-700">
      {activeMenu && (
        <>
          <div className="flex justify-between items-center px-6 pt-6">
            <Link to="/" onClick={handleCloseSideBar} className="items-center gap-3 flex text-xl font-bold tracking-tight dark:text-white text-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500 text-white shadow-md">
                <CiStar className="text-xl" />
              </div>
              <div>
                <p className="text-lg font-bold">OCP Dash</p>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            </Link>
            <TooltipComponent content="Menu" position="BottomCenter">
              <button
                type="button"
                onClick={() => setActiveMenu(!activeMenu)}
                style={{ color: currentColor }}
                className="text-xl rounded-full p-3 hover:bg-light-gray mt-4 block md:hidden"
              >
                <MdOutlineCancel />
              </button>
            </TooltipComponent>
          </div>

          <div className="px-4 mt-8">
            {links.map((item) => (
              <div key={item.title} className="mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
                  {item.title}
                </p>
                <div className="rounded-[20px] bg-slate-50 dark:bg-[#1f2937] p-3 mb-3">
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
                      {link.icon}
                      <span className="capitalize">{link.name}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto px-6 pb-6">
            <div className="rounded-[20px] mb-3 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#111827] p-4 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-xl font-bold">M</div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">Mike Nielsen</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Admin</p>
                </div>
              </div>
              <button
                type="button"
                className="w-full text-center rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-2 font-medium hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                View Profile
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Sidebar;
